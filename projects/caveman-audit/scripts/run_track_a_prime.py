#!/usr/bin/env python3
"""Track A' (API direct, CC-matched parameters).

Same harness as Track A but with parameters matching CC CLI defaults:
  - Anthropic SDK direct (not Claude Code CLI)
  - NORMAL_SYSTEM = "You are a helpful assistant."
  - Caveman system = full SKILL.md
  - max_tokens=16384, extended thinking enabled (budget=4000)
  - temperature omitted (required when thinking is enabled; defaults to 1.0)

Comparing A vs A' isolates the effect of API parameters (thinking, temperature,
max_tokens) on Caveman's savings, independent of system prompt content.

Requires:
  pip install anthropic
  export ANTHROPIC_API_KEY=...

Config via environment variables:
  RUNS_PER_CONDITION  trials per prompt per mode (default: 10)
  MODEL               model id (default: claude-sonnet-4-6)
  MAX_WORKERS         parallel API calls (default: 3)
"""

from __future__ import annotations

import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import anthropic
from tqdm import tqdm

from _config import (
    CONDITIONS,
    DEFAULT_MODEL,
    DEFAULT_RUNS_PER_CONDITION,
    MAX_RETRIES,
    REPO_ROOT,
    RETRY_BACKOFF,
    RUNS_DIR,
    SKILL_PATH,
    load_prompts,
    output_path,
)

OUTPUT_DIR = RUNS_DIR / "track_a_prime"

_env_file = REPO_ROOT / ".env.local"
if _env_file.exists():
    for line in _env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

RUNS_PER_CONDITION = int(os.environ.get("RUNS_PER_CONDITION", str(DEFAULT_RUNS_PER_CONDITION)))
MODEL = os.environ.get("MODEL", DEFAULT_MODEL)
MAX_WORKERS = int(os.environ.get("MAX_WORKERS", "3"))

NORMAL_SYSTEM = "You are a helpful assistant."
MAX_TOKENS = 16384
THINKING_BUDGET = 4000


def load_caveman_system() -> str:
    return SKILL_PATH.read_text()


def call_api(client: anthropic.Anthropic, system: str, prompt: str) -> dict:
    last_err: Exception | None = None
    for attempt in range(MAX_RETRIES):
        if attempt > 0:
            delay = RETRY_BACKOFF[attempt - 1]
            tqdm.write(f"  retry {attempt}/{MAX_RETRIES - 1} (wait {delay}s): {last_err}")
            time.sleep(delay)
        try:
            t0 = time.monotonic()
            response = client.messages.create(
                model=MODEL,
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


def run_one(client: anthropic.Anthropic, prompt_entry: dict, condition: str,
            run_num: int, caveman_system: str) -> str:
    pid = prompt_entry["id"]
    outfile = output_path(OUTPUT_DIR, pid, condition, run_num)
    if outfile.exists():
        return "skip"

    system = NORMAL_SYSTEM if condition == "baseline" else caveman_system
    result = call_api(client, system, prompt_entry["prompt"])

    result["_meta"] = {
        "track": "A_prime",
        "task": pid,
        "category": prompt_entry["category"],
        "condition": condition,
        "run_num": run_num,
        "model": MODEL,
        "max_tokens": MAX_TOKENS,
        "thinking_budget": THINKING_BUDGET,
        "system_len_chars": len(system),
        "timestamp": int(time.time()),
    }
    outfile.write_text(json.dumps(result, indent=2))
    return "ok"


def main() -> None:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    prompts = load_prompts()
    caveman_system = load_caveman_system()
    client = anthropic.Anthropic()

    work = [
        (p, cond, i)
        for p in prompts
        for cond in CONDITIONS
        for i in range(1, RUNS_PER_CONDITION + 1)
    ]
    total = len(work)

    print("=== Track A' Runner (API direct, CC-matched parameters) ===")
    print(f"Prompts:            {len(prompts)}")
    print(f"Runs per condition: {RUNS_PER_CONDITION}")
    print(f"Max workers:        {MAX_WORKERS}")
    print(f"Model:              {MODEL}")
    print(f"Total API calls:    {total}")
    print()

    counts = {"ok": 0, "skip": 0, "fail": 0}
    start = time.monotonic()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {
            pool.submit(run_one, client, p, cond, i, caveman_system): (p["id"], cond, i)
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
