#!/usr/bin/env python3
"""Track A interactive session runner.

Guides you through 60 manual sessions (3 tasks × 2 conditions × 10 runs).
Launches real Claude Code windows via run_claude_interactive().
Captures JSON output if --output-format json works in interactive mode;
falls back to prompting for manual metric entry.

Config via environment variables:
  RUNS_PER_CONDITION  runs per task/condition pair (default: 10)
  MODEL               claude model to use (default: claude-sonnet-4-6)
  CLAUDE_CONFIG_DIR   claude config dir (default: ~/.claude-clean)
  RANDOMIZE           shuffle run order within each task (default: 1)
"""

from __future__ import annotations

import json
import os
import random
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from utils.runner import run_claude_interactive

PROJECT_DIR = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_DIR / "data" / "runs" / "track_a"
TASKS_DIR = PROJECT_DIR / "data" / "tasks"

RUNS_PER_CONDITION = int(os.environ.get("RUNS_PER_CONDITION", "10"))
MODEL = os.environ.get("MODEL", "claude-sonnet-4-6")
CLAUDE_CONFIG_DIR = os.environ.get("CLAUDE_CONFIG_DIR", str(Path.home() / ".claude-clean"))
RANDOMIZE = os.environ.get("RANDOMIZE", "1") != "0"

DISABLE_CAVEMAN = {"enabledPlugins": {"caveman@caveman": False}}


def build_run_order(tasks: list[str]) -> list[tuple[str, str, int]]:
    runs = []
    for task in tasks:
        pairs = (
            [("baseline", i) for i in range(1, RUNS_PER_CONDITION + 1)]
            + [("caveman", i) for i in range(1, RUNS_PER_CONDITION + 1)]
        )
        if RANDOMIZE:
            random.shuffle(pairs)
        for condition, run_num in pairs:
            runs.append((task, condition, run_num))
    return runs


def prompt_manual_metrics() -> dict:
    print("\n  /cost output not captured. Enter metrics manually (press Enter to skip):")
    fields = {}
    for key, label in [
        ("output_tokens", "Output tokens"),
        ("input_tokens", "Input tokens"),
        ("cost_usd", "Cost USD"),
        ("num_turns", "Number of turns"),
        ("wall_clock_sec", "Wall clock seconds"),
        ("notes", "Notes"),
    ]:
        val = input(f"    {label}: ").strip()
        if val:
            try:
                fields[key] = float(val) if "." in val else int(val)
            except ValueError:
                fields[key] = val
    return fields


def run_session(task: str, condition: str, run_num: int) -> None:
    outfile = OUTPUT_DIR / f"{task}_{condition}_{run_num:03d}.json"
    if outfile.exists():
        print(f"  SKIP: {outfile.name} already exists")
        return

    prompt_file = TASKS_DIR / f"{task}.txt"
    prompt_text = prompt_file.read_text()

    session_name = f"audit_{task}_{condition}_{run_num:03d}"
    settings = DISABLE_CAVEMAN if condition == "baseline" else None

    print(f"\n{'='*60}")
    print(f"  Task:      {task}")
    print(f"  Condition: {condition.upper()}")
    print(f"  Run:       {run_num:03d}")
    print(f"  Session:   {session_name}")
    print(f"{'='*60}")
    print(f"\n  PROMPT:\n")
    for line in prompt_text.splitlines():
        print(f"    {line}")
    print()

    if condition == "baseline":
        print("  ⚠  BASELINE: Caveman will be disabled automatically via --settings.")
    else:
        print("  ✓  CAVEMAN: Let Caveman auto-activate. Confirm 'CAVEMAN MODE ACTIVE' visible.")

    input("\n  Press Enter to launch Claude Code session...")

    output_path, wall_clock = run_claude_interactive(
        session_name=session_name,
        settings=settings,
        output_dir=OUTPUT_DIR,
        env={"CLAUDE_CONFIG_DIR": CLAUDE_CONFIG_DIR},
    )

    if output_path and output_path.exists():
        data = json.loads(output_path.read_text())
        data["_meta"] = {
            "task": task,
            "condition": condition,
            "run_num": run_num,
            "model": MODEL,
            "wall_clock_sec": round(wall_clock, 2),
            "timestamp": int(time.time()),
            "metrics_from": "json_output",
            "claude_config_dir": CLAUDE_CONFIG_DIR,
        }
        output_path.write_text(json.dumps(data, indent=2))
        # rename to standard filename if session_name differs
        if output_path != outfile:
            output_path.rename(outfile)
        print(f"\n  ✓ Saved: {outfile.name}")
    else:
        print("\n  JSON output not captured. Falling back to manual entry.")
        manual = prompt_manual_metrics()
        data = {
            "_meta": {
                "task": task,
                "condition": condition,
                "run_num": run_num,
                "model": MODEL,
                "wall_clock_sec": round(wall_clock, 2),
                "timestamp": int(time.time()),
                "metrics_from": "manual",
                "claude_config_dir": CLAUDE_CONFIG_DIR,
            },
            **manual,
        }
        outfile.write_text(json.dumps(data, indent=2))
        print(f"  ✓ Saved (manual): {outfile.name}")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    tasks = sorted(p.stem for p in TASKS_DIR.glob("*.txt"))
    if not tasks:
        print(f"ERROR: no task files in {TASKS_DIR}", file=sys.stderr)
        sys.exit(1)

    runs = build_run_order(tasks)
    total = len(runs)
    done = sum(1 for task, cond, num in runs if (OUTPUT_DIR / f"{task}_{cond}_{num:03d}.json").exists())
    remaining = total - done

    print("=== Track A Interactive Runner ===")
    print(f"Tasks:              {tasks}")
    print(f"Runs per condition: {RUNS_PER_CONDITION}")
    print(f"Model:              {MODEL}")
    print(f"Config dir:         {CLAUDE_CONFIG_DIR}")
    print(f"Randomized order:   {RANDOMIZE}")
    print(f"Total sessions:     {total}  (done={done}, remaining={remaining})")
    print()

    if remaining == 0:
        print("All sessions complete.")
        return

    print("Sessions will launch one at a time. You interact normally.")
    print("After each session, metrics are saved automatically (or you enter them manually).")
    input("\nPress Enter to begin...\n")

    for task, condition, run_num in runs:
        outfile = OUTPUT_DIR / f"{task}_{condition}_{run_num:03d}.json"
        if outfile.exists():
            continue
        try:
            run_session(task, condition, run_num)
        except KeyboardInterrupt:
            print("\n\nInterrupted. Progress saved. Re-run to continue.")
            sys.exit(0)

    print("\n=== All sessions complete ===")


if __name__ == "__main__":
    main()
