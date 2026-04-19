"""Shared config for Track B / C runners.

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
DEFAULT_RUNS_PER_CONDITION = 10
DEFAULT_MAX_WORKERS = 5

CONDITIONS = ("baseline", "caveman")

MAX_RETRIES = 3
RETRY_BACKOFF = (5, 15, 30)


def load_prompts() -> list[dict]:
    return json.loads(PROMPTS_PATH.read_text())["prompts"]


def output_path(output_dir: Path, pid: str, condition: str, run_num: int) -> Path:
    return output_dir / f"{pid}_{condition}_{run_num:03d}.json"
