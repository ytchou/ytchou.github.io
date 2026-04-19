"""Execution and prompt helpers for Claude Code runs."""

from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path
from typing import Any

FILLER_BLOCK = """
## API Reference: Data Processing Pipeline

The DataProcessor class handles ingestion, transformation, and output of structured
records. It supports batch and streaming modes with configurable parallelism.

### Methods

- `process(records: list[dict]) -> list[dict]`: Transform a batch of records according
  to the configured pipeline stages. Returns processed records with metadata attached.
- `validate(schema: dict, record: dict) -> bool`: Check a record against a JSON schema.
  Returns True if valid, raises ValidationError with details if not.
- `merge(left: list[dict], right: list[dict], on: str) -> list[dict]`: Join two record
  sets on a shared key field. Performs an inner join by default.

### Configuration

```python
config = {
    "batch_size": 1000,
    "max_workers": 4,
    "retry_policy": {"max_retries": 3, "backoff_factor": 1.5},
    "output_format": "jsonl",
}
processor = DataProcessor(config)
```

### Error Handling

The processor uses a dead-letter queue for records that fail transformation after all
retries are exhausted. Failed records are written to `output/failed/` with error metadata
including the stage that failed, the exception type, and a truncated traceback.
"""

CHARS_PER_TOKEN = 4


def run_claude(
    prompt: str,
    *,
    model: str = "claude-sonnet-4-6",
    max_turns: int | None = None,
    settings: dict[str, Any] | None = None,
    stream: bool = False,
    timeout: int = 300,
    env: dict[str, str] | None = None,
) -> tuple[dict[str, Any] | str, float]:
    """Run claude -p and return (output, wall_clock_seconds).

    With stream=False (default): returns (parsed_json_dict, seconds).
    With stream=True: returns (raw_ndjson_string, seconds).
    env: extra environment variables merged into the subprocess env.
    """
    import os
    cmd = ["claude", "-p", prompt, "--model", model]

    if stream:
        cmd += ["--output-format", "stream-json", "--verbose"]
    else:
        cmd += ["--output-format", "json"]

    if max_turns is not None:
        cmd += ["--max-turns", str(max_turns)]

    if settings:
        cmd += ["--settings", json.dumps(settings)]

    proc_env = {**os.environ, **(env or {})}

    start = time.monotonic()
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=timeout,
        env=proc_env,
    )
    wall_clock = time.monotonic() - start

    result.check_returncode()

    if stream:
        return result.stdout, wall_clock

    return json.loads(result.stdout), wall_clock


def run_claude_interactive(
    *,
    session_name: str | None = None,
    settings: dict[str, Any] | None = None,
    output_dir: Path | None = None,
    env: dict[str, str] | None = None,
) -> tuple[Path | None, float]:
    """Launch interactive Claude Code session with passthrough I/O.

    Returns (output_json_path_or_none, wall_clock_seconds).
    The output JSON (if captured) is readable by parse_run_file().
    env: extra environment variables merged into the subprocess env.
    """
    import os
    cmd = ["claude"]

    if session_name:
        cmd += ["--name", session_name]

    if settings:
        cmd += ["--settings", json.dumps(settings)]

    if output_dir:
        cmd += ["--output-format", "json"]

    proc_env = {**os.environ, **(env or {})}

    start = time.monotonic()
    result = subprocess.run(cmd, env=proc_env)
    wall_clock = time.monotonic() - start

    output_path = None
    if output_dir and result.stdout:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        name = session_name or f"interactive_{int(time.time())}"
        output_path = output_dir / f"{name}.json"
        output_path.write_text(result.stdout)

    return output_path, wall_clock


def pad_prompt(
    prompt: str,
    *,
    target_tokens: int,
    method: str = "prepend",
) -> str:
    """Inflate a prompt to approximate a target token count.

    The actual token count is measured from the run output — this is a
    rough approximation to get in the right ballpark.
    """
    current_chars = len(prompt)
    target_chars = target_tokens * CHARS_PER_TOKEN
    padding_chars = target_chars - current_chars

    if padding_chars <= 0:
        return prompt

    block_chars = len(FILLER_BLOCK)
    repeats = (padding_chars // block_chars) + 1
    padding = (FILLER_BLOCK * repeats)[:padding_chars]

    if method == "prepend":
        return (
            "The following reference documentation is provided as context.\n"
            "Answer the question at the end.\n\n"
            "---BEGIN REFERENCE---\n"
            f"{padding}\n"
            "---END REFERENCE---\n\n"
            f"{prompt}"
        )

    if method == "system_context":
        return (
            "Previous conversation context:\n\n"
            f"User: Can you review this documentation?\n\n"
            f"Assistant: Here is the documentation review:\n{padding}\n\n"
            "User: Thanks. Now for a new question:\n\n"
            f"{prompt}"
        )

    raise ValueError(f"Unknown method: {method!r}. Use 'prepend' or 'system_context'.")
