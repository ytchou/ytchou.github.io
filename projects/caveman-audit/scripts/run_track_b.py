#!/usr/bin/env python3
"""Track B automated runner: parallel headless claude -p runs.

Uses the same 10 prompts as Track C (`data/fixtures/prompts.json`) so results
are directly comparable. Only difference vs Track C: harness (Claude Code CLI
vs Anthropic API direct).

Config via environment variables:
  RUNS_PER_CONDITION  runs per prompt/condition pair (default: 10)
  MODEL               claude model to use (default: claude-sonnet-4-6)
  MAX_WORKERS         parallel claude processes (default: 5)
  CLAUDE_CONFIG_DIR   claude config dir (default: ~/.claude-clean)
"""

from __future__ import annotations

import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from utils.runner import run_claude

from _config import (
    CONDITIONS,
    DEFAULT_MAX_WORKERS,
    DEFAULT_MODEL,
    DEFAULT_RUNS_PER_CONDITION,
    MAX_RETRIES,
    RETRY_BACKOFF,
    RUNS_DIR,
    load_prompts,
    output_path,
)

OUTPUT_DIR = RUNS_DIR / "track_b"

RUNS_PER_CONDITION = int(os.environ.get("RUNS_PER_CONDITION", str(DEFAULT_RUNS_PER_CONDITION)))
MODEL = os.environ.get("MODEL", DEFAULT_MODEL)
MAX_WORKERS = int(os.environ.get("MAX_WORKERS", str(DEFAULT_MAX_WORKERS)))
CLAUDE_CONFIG_DIR = os.environ.get("CLAUDE_CONFIG_DIR", str(Path.home() / ".claude-clean"))

DISABLE_CAVEMAN = {"enabledPlugins": {"caveman@caveman": False}}
ENABLE_CAVEMAN = {"enabledPlugins": {"caveman@caveman": True}}


def run_one(prompt_entry: dict, condition: str, run_num: int) -> str:
    pid = prompt_entry["id"]
    outfile = output_path(OUTPUT_DIR, pid, condition, run_num)
    if outfile.exists():
        return "skip"

    settings = DISABLE_CAVEMAN if condition == "baseline" else ENABLE_CAVEMAN
    prompt = prompt_entry["prompt"]

    last_err: Exception | None = None
    for attempt in range(MAX_RETRIES):
        if attempt > 0:
            delay = RETRY_BACKOFF[attempt - 1]
            tqdm.write(f"  retry {attempt}/{MAX_RETRIES - 1} for {pid}/{condition}/{run_num:03d} (wait {delay}s)")
            time.sleep(delay)
        try:
            data, wall_clock = run_claude(
                prompt,
                model=MODEL,
                settings=settings,
                timeout=300,
                env={"CLAUDE_CONFIG_DIR": CLAUDE_CONFIG_DIR},
            )
            data["_meta"] = {
                "track": "B",
                "task": pid,
                "category": prompt_entry["category"],
                "condition": condition,
                "run_num": run_num,
                "model": MODEL,
                "wall_clock_sec": round(wall_clock, 2),
                "timestamp": int(time.time()),
                "claude_config_dir": CLAUDE_CONFIG_DIR,
            }
            outfile.write_text(json.dumps(data, indent=2))
            return "ok"
        except Exception as e:
            last_err = e

    raise RuntimeError(f"failed after {MAX_RETRIES} attempts: {last_err}")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    prompts = load_prompts()
    if not prompts:
        print("ERROR: no prompts loaded", file=sys.stderr)
        sys.exit(1)

    work = [
        (p, cond, i)
        for p in prompts
        for cond in CONDITIONS
        for i in range(1, RUNS_PER_CONDITION + 1)
    ]
    total = len(work)

    print("=== Track B Runner (Claude Code CLI, Track C prompts) ===")
    print(f"Prompts:            {len(prompts)}")
    print(f"Runs per condition: {RUNS_PER_CONDITION}")
    print(f"Max workers:        {MAX_WORKERS}")
    print(f"Model:              {MODEL}")
    print(f"Config dir:         {CLAUDE_CONFIG_DIR}")
    print(f"Total:              {total}")
    print()

    counts = {"ok": 0, "skip": 0, "fail": 0}
    start = time.monotonic()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {
            pool.submit(run_one, p, cond, i): (p["id"], cond, i)
            for p, cond, i in work
        }

        with tqdm(total=total, unit="run", dynamic_ncols=True) as bar:
            for future in as_completed(futures):
                pid, cond, i = futures[future]
                try:
                    status = future.result()
                except Exception as e:
                    status = "fail"
                    tqdm.write(f"FAIL {pid}/{cond}/{i:03d}: {e}", file=sys.stderr)

                counts[status] += 1
                bar.update(1)
                bar.set_postfix(ok=counts["ok"], skip=counts["skip"], fail=counts["fail"])

    elapsed = time.monotonic() - start
    print(f"\n=== Done ({elapsed:.0f}s) ===")
    print(f"ok={counts['ok']}  skip={counts['skip']}  fail={counts['fail']}")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
