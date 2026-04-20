#!/usr/bin/env python3
"""Track C: context-size sweep via Anthropic API direct.

Tests how Caveman's compression degrades as CC system prompt content accumulates.
Decomposes CC's ~18K system prompt into a behavioral block (always present) plus
10 tool-definition chunks that are shuffled and added incrementally.

API parameters match CC CLI defaults: max_tokens=16384, extended thinking enabled
(budget_tokens=4000), temperature omitted (required when thinking is on; defaults to 1.0).

6 measurement levels:
  Level 0: behavioral block only (~3,500 tok)
  Level 1-5: behavioral + 2/4/6/8/10 tool-def chunks

Each task gets N orderings (random permutations of tool-def chunks), with
deterministic seeds for reproducibility.

Requires:
  pip install anthropic tqdm
  export ANTHROPIC_API_KEY=...

Config via environment variables:
  RUNS_PER_TASK   orderings per task (default: 5)
  MODEL           model id (default: claude-sonnet-4-6)
  MAX_WORKERS     parallel API calls (default: 3)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import anthropic
from tqdm import tqdm

from _config import (
    CONDITIONS,
    DEFAULT_MODEL,
    DEFAULT_SWEEP_RUNS,
    MAX_RETRIES,
    NUM_TOOLDEF_CHUNKS,
    REPO_ROOT,
    RETRY_BACKOFF,
    RUNS_DIR,
    SKILL_PATH,
    SWEEP_TASKS,
    load_behavioral_block,
    load_prompts,
    load_tooldef_chunks,
    sweep_output_path,
)

OUTPUT_DIR = RUNS_DIR / "track_c"

_env_file = REPO_ROOT / ".env.local"
if _env_file.exists():
    for line in _env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

MAX_TOKENS = 16384
THINKING_BUDGET = 4000

NUM_LEVELS = 6  # level 0 = behavioral only, levels 1-5 = +2/4/6/8/10 chunks


def make_ordering(task_id: str, run_num: int) -> list[int]:
    raw = f"caveman-track-c:{task_id}:{run_num}"
    seed = int(hashlib.sha256(raw.encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)
    ordering = list(range(NUM_TOOLDEF_CHUNKS))
    rng.shuffle(ordering)
    return ordering


def build_system(
    behavioral: str,
    chunks: list[str],
    ordering: list[int],
    level: int,
    condition: str,
    caveman_text: str,
) -> str:
    parts = [behavioral]
    if level > 0:
        num_chunks = level * 2
        parts.extend(chunks[ordering[i]] for i in range(num_chunks))
    system = "\n\n".join(parts)
    if condition == "caveman":
        return caveman_text + "\n\n" + system
    return system


def call_api(client: anthropic.Anthropic, system: str, prompt: str, model: str) -> dict:
    last_err: Exception | None = None
    for attempt in range(MAX_RETRIES):
        if attempt > 0:
            delay = RETRY_BACKOFF[attempt - 1]
            tqdm.write(f"  retry {attempt}/{MAX_RETRIES - 1} (wait {delay}s): {last_err}")
            time.sleep(delay)
        try:
            t0 = time.monotonic()
            response = client.messages.create(
                model=model,
                max_tokens=MAX_TOKENS,
                thinking={"type": "enabled", "budget_tokens": THINKING_BUDGET},
                system=system,
                messages=[{"role": "user", "content": prompt}],
            )
            wall_clock = time.monotonic() - t0
            text = ""
            thinking_text = ""
            for block in response.content:
                if block.type == "text":
                    text = block.text
                elif block.type == "thinking":
                    thinking_text = block.thinking
            return {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "cache_creation_input_tokens": getattr(response.usage, "cache_creation_input_tokens", 0) or 0,
                "cache_read_input_tokens": getattr(response.usage, "cache_read_input_tokens", 0) or 0,
                "text": text,
                "thinking_text": thinking_text,
                "stop_reason": response.stop_reason,
                "wall_clock_sec": round(wall_clock, 2),
            }
        except (anthropic.RateLimitError, anthropic.APIConnectionError, anthropic.APIStatusError) as e:
            last_err = e
    raise RuntimeError(f"failed after {MAX_RETRIES} attempts: {last_err}")


def chunks_at_level(ordering: list[int], level: int) -> list[int]:
    if level == 0:
        return []
    return sorted(ordering[: level * 2])


def run_one(
    client: anthropic.Anthropic,
    behavioral: str,
    chunks: list[str],
    chunk_char_counts: list[int],
    caveman_text: str,
    task_entry: dict,
    condition: str,
    run_num: int,
    level: int,
    ordering: list[int],
    model: str,
) -> str:
    task_id = task_entry["id"]
    outfile = sweep_output_path(OUTPUT_DIR, task_id, condition, run_num, level)
    if outfile.exists():
        return "skip"

    system = build_system(behavioral, chunks, ordering, level, condition, caveman_text)
    result = call_api(client, system, task_entry["prompt"], model)

    present = chunks_at_level(ordering, level)
    behavioral_chars = len(behavioral)
    chunk_chars = sum(chunk_char_counts[ordering[i]] for i in range(level * 2)) if level > 0 else 0

    result["_meta"] = {
        "track": "C",
        "task": task_id,
        "category": task_entry["category"],
        "condition": condition,
        "run_num": run_num,
        "model": model,
        "max_tokens": MAX_TOKENS,
        "thinking_budget": THINKING_BUDGET,
        "system_len_chars": len(system),
        "timestamp": int(time.time()),
        "level": level,
        "ordering": ordering,
        "chunks_present": present,
        "num_chunks": level * 2 if level > 0 else 0,
        "behavioral_chars": behavioral_chars,
        "chunk_chars": chunk_chars,
    }
    outfile.write_text(json.dumps(result, indent=2))
    return "ok"


def main() -> None:
    parser = argparse.ArgumentParser(description="Track C context-size sweep")
    parser.add_argument("--pilot", action="store_true", help="Run 12-call calibration pilot (1 task, canonical order)")
    parser.add_argument("--runs", type=int, default=None, help=f"Orderings per task (default: {DEFAULT_SWEEP_RUNS})")
    parser.add_argument("--max-workers", type=int, default=None, help="Parallel API calls (default: 3)")
    args = parser.parse_args()

    model = os.environ.get("MODEL", DEFAULT_MODEL)
    runs_per_task = args.runs or int(os.environ.get("RUNS_PER_TASK", str(DEFAULT_SWEEP_RUNS)))
    max_workers = args.max_workers or int(os.environ.get("MAX_WORKERS", "3"))

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    behavioral = load_behavioral_block()
    chunks = load_tooldef_chunks()
    chunk_char_counts = [len(c) for c in chunks]
    caveman_text = SKILL_PATH.read_text()
    all_prompts = load_prompts()
    prompts_by_id = {p["id"]: p for p in all_prompts}

    if args.pilot:
        task_ids = [SWEEP_TASKS[0]]
        runs_per_task = 1
        print("=== Track C PILOT (calibration) ===")
    else:
        task_ids = SWEEP_TASKS
        print("=== Track C Sweep Runner ===")

    tasks = []
    for tid in task_ids:
        if tid not in prompts_by_id:
            print(f"ERROR: task {tid!r} not found in prompts.json", file=sys.stderr)
            sys.exit(1)
        tasks.append(prompts_by_id[tid])

    work = []
    for task in tasks:
        for run_num in range(1, runs_per_task + 1):
            if args.pilot:
                ordering = list(range(NUM_TOOLDEF_CHUNKS))
            else:
                ordering = make_ordering(task["id"], run_num)
            for level in range(NUM_LEVELS):
                for condition in CONDITIONS:
                    work.append((task, condition, run_num, level, ordering))

    total = len(work)
    print(f"Tasks:           {[t['id'] for t in tasks]}")
    print(f"Runs per task:   {runs_per_task}")
    print(f"Levels:          {NUM_LEVELS} (0=behavioral, 1-5=+2/4/6/8/10 chunks)")
    print(f"Conditions:      {CONDITIONS}")
    print(f"Max workers:     {max_workers}")
    print(f"Model:           {model}")
    print(f"Total API calls: {total}")
    print(f"Behavioral block: {len(behavioral):,} chars")
    print(f"Tool-def chunks:  {sum(chunk_char_counts):,} chars ({NUM_TOOLDEF_CHUNKS} chunks)")
    print()

    client = anthropic.Anthropic()
    counts = {"ok": 0, "skip": 0, "fail": 0}
    start = time.monotonic()

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {
            pool.submit(
                run_one, client, behavioral, chunks, chunk_char_counts,
                caveman_text, task, cond, run, level, ordering, model,
            ): (task["id"], cond, run, level)
            for task, cond, run, level, ordering in work
        }
        with tqdm(total=total, unit="call", dynamic_ncols=True) as bar:
            for future in as_completed(futures):
                tid, cond, run, level = futures[future]
                try:
                    status = future.result()
                except Exception as e:
                    status = "fail"
                    tqdm.write(f"FAIL {tid}/{cond}/r{run:03d}/l{level:02d}: {e}", file=sys.stderr)
                counts[status] += 1
                bar.update(1)
                bar.set_postfix(ok=counts["ok"], skip=counts["skip"], fail=counts["fail"])

    elapsed = time.monotonic() - start
    print(f"\n=== Done ({elapsed:.0f}s) ===")
    print(f"ok={counts['ok']}  skip={counts['skip']}  fail={counts['fail']}")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
