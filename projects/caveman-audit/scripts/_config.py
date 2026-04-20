"""Shared config for all track runners.

Track-specific concerns (harness, baseline system, API key, plugin toggle)
stay in each runner. Only truly shared values live here.
"""

from __future__ import annotations

import json
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]

DATA_DIR = PROJECT_DIR / "data"
PROMPTS_PATH = DATA_DIR / "prompts.json"
SKILL_PATH = DATA_DIR / "SKILL.md"

RUNS_DIR = PROJECT_DIR / "outputs" / "runs"

DEFAULT_MODEL = "claude-sonnet-4-6"
DEFAULT_RUNS_PER_CONDITION = 5
DEFAULT_MAX_WORKERS = 5

CONDITIONS = ("baseline", "caveman")

MAX_RETRIES = 3
RETRY_BACKOFF = (5, 15, 30)


def load_prompts() -> list[dict]:
    return json.loads(PROMPTS_PATH.read_text())["prompts"]


def output_path(output_dir: Path, pid: str, condition: str, run_num: int) -> Path:
    return output_dir / f"{pid}_{condition}_{run_num:03d}.json"


# --- Track C sweep config ---

CC_SLICES_DIR = DATA_DIR / "cc_slices"
NUM_TOOLDEF_CHUNKS = 10
DEFAULT_SWEEP_RUNS = 5
SWEEP_TASKS = [
    "error-boundary",
    "async-refactor",
    "pr-security-review",
]


def load_behavioral_block() -> str:
    return (CC_SLICES_DIR / "behavioral_block.txt").read_text()


def load_tooldef_chunks() -> list[str]:
    chunks = []
    for i in range(1, NUM_TOOLDEF_CHUNKS + 1):
        chunks.append((CC_SLICES_DIR / f"tooldef_{i:02d}.txt").read_text())
    return chunks


def sweep_output_path(
    output_dir: Path, task: str, condition: str, run_num: int, level: int
) -> Path:
    return output_dir / f"{task}_{condition}_r{run_num:03d}_l{level:02d}.json"
