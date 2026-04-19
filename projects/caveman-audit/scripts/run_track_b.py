#!/usr/bin/env python3
"""Track B automated runner: parallel headless claude -p runs.

Config via environment variables:
  RUNS_PER_CONDITION  runs per task/condition pair (default: 30)
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

PROJECT_DIR = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_DIR / "data" / "runs" / "track_b"
TASKS_DIR = PROJECT_DIR / "data" / "tasks"

RUNS_PER_CONDITION = int(os.environ.get("RUNS_PER_CONDITION", "30"))
MODEL = os.environ.get("MODEL", "claude-sonnet-4-6")
MAX_WORKERS = int(os.environ.get("MAX_WORKERS", "5"))
CLAUDE_CONFIG_DIR = os.environ.get("CLAUDE_CONFIG_DIR", str(Path.home() / ".claude-clean"))

DISABLE_CAVEMAN = {"enabledPlugins": {"caveman@caveman": False}}


MAX_RETRIES = 3
RETRY_BACKOFF = [5, 15, 30]  # seconds between attempts


def run_one(task: str, condition: str, run_num: int) -> str:
    """Run a single session. Returns status string for tqdm postfix."""
    outfile = OUTPUT_DIR / f"{task}_{condition}_{run_num:03d}.json"
    if outfile.exists():
        return "skip"

    settings = DISABLE_CAVEMAN if condition == "baseline" else None
    prompt = (TASKS_DIR / f"{task}.txt").read_text()

    last_err: Exception | None = None
    for attempt in range(MAX_RETRIES):
        if attempt > 0:
            delay = RETRY_BACKOFF[attempt - 1]
            tqdm.write(f"  retry {attempt}/{MAX_RETRIES - 1} for {task}/{condition}/{run_num:03d} (wait {delay}s)")
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
                "task": task,
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

    tasks = sorted(p.stem for p in TASKS_DIR.glob("*.txt"))
    if not tasks:
        print(f"ERROR: no task files in {TASKS_DIR}", file=sys.stderr)
        sys.exit(1)

    conditions = ["baseline", "caveman"]
    work = [
        (task, condition, i)
        for task in tasks
        for condition in conditions
        for i in range(1, RUNS_PER_CONDITION + 1)
    ]
    total = len(work)

    print("=== Track B Runner ===")
    print(f"Tasks:              {tasks}")
    print(f"Runs per condition: {RUNS_PER_CONDITION}")
    print(f"Max workers:        {MAX_WORKERS}")
    print(f"Model:              {MODEL}")
    print(f"Config dir:         {CLAUDE_CONFIG_DIR}")
    print(f"Total:              {total}")
    print()

    counts = {"ok": 0, "skip": 0, "fail": 0}
    start = time.monotonic()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(run_one, task, cond, num): (task, cond, num) for task, cond, num in work}

        with tqdm(total=total, unit="run", dynamic_ncols=True) as bar:
            for future in as_completed(futures):
                task, cond, num = futures[future]
                try:
                    status = future.result()
                except Exception as e:
                    status = "fail"
                    tqdm.write(f"FAIL {task}/{cond}/{num:03d}: {e}", file=sys.stderr)

                counts[status] += 1
                bar.update(1)
                bar.set_postfix(ok=counts["ok"], skip=counts["skip"], fail=counts["fail"])

    elapsed = time.monotonic() - start
    print(f"\n=== Done ({elapsed:.0f}s) ===")
    print(f"ok={counts['ok']}  skip={counts['skip']}  fail={counts['fail']}")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
