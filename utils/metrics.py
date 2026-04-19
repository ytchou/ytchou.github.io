"""Parsing, file I/O, and logging for Claude Code usage data."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from utils.models import UsageRecord


def extract_usage(data: dict[str, Any]) -> UsageRecord:
    """Extract a UsageRecord from Claude Code JSON output.

    Works with --output-format json output. Tool call fields will be empty
    (not available in json format — use parse_stream_json for those).
    """
    usage = data.get("usage", {})
    model_usage = data.get("modelUsage", {})

    primary_model = ""
    for model_id, model_data in model_usage.items():
        if not primary_model or model_data.get("outputTokens", 0) > model_usage.get(primary_model, {}).get("outputTokens", 0):
            primary_model = model_id

    input_tokens = usage.get("input_tokens", 0)
    cache_creation = usage.get("cache_creation_input_tokens", 0)
    cache_read = usage.get("cache_read_input_tokens", 0)

    total_input = input_tokens + cache_creation + cache_read
    effective_input = input_tokens + (cache_creation * 1.25) + (cache_read * 0.1)

    iterations = usage.get("iterations", [])

    return UsageRecord(
        input_tokens=input_tokens,
        output_tokens=usage.get("output_tokens", 0),
        cache_creation_tokens=cache_creation,
        cache_read_tokens=cache_read,
        total_input_tokens=total_input,
        effective_input_tokens=effective_input,
        num_turns=data.get("num_turns", 0),
        num_iterations=len(iterations),
        duration_ms=data.get("duration_ms", 0),
        duration_api_ms=data.get("duration_api_ms", 0),
        cost_usd=data.get("total_cost_usd", 0.0),
        model=primary_model,
        stop_reason=data.get("stop_reason", ""),
        result_length=len(data.get("result", "")),
        session_id=data.get("session_id", ""),
        is_error=data.get("is_error", False),
    )


def parse_stream_json(ndjson_text: str) -> UsageRecord:
    """Parse stream-json NDJSON output for detailed metrics including tool calls.

    Use with: claude -p "..." --output-format stream-json --verbose
    """
    tool_counts: dict[str, int] = {}
    result_data: dict[str, Any] = {}

    for line in ndjson_text.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue

        if event.get("type") == "result":
            result_data = event

        if event.get("type") == "assistant":
            message = event.get("message", {})
            for block in message.get("content", []):
                if block.get("type") == "tool_use":
                    name = block.get("name", "unknown")
                    tool_counts[name] = tool_counts.get(name, 0) + 1

    record = extract_usage(result_data) if result_data else UsageRecord()
    record.tool_calls = tool_counts
    record.total_tool_calls = sum(tool_counts.values())
    record.used_agent = "Agent" in tool_counts

    return record


def parse_run_file(filepath: Path) -> tuple[UsageRecord, dict[str, Any]] | None:
    """Read a Claude Code JSON output file and extract usage.

    Returns (record, raw_data) or None on error. raw_data includes
    '_file' key with the filepath for caller convenience.
    """
    try:
        with open(filepath) as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"WARN: skipping {filepath}: {e}", file=sys.stderr)
        return None

    if data.get("is_error"):
        print(f"WARN: error run {filepath}: {data.get('result', '')[:80]}", file=sys.stderr)
        return None

    data["_file"] = str(filepath)
    record = extract_usage(data)
    return record, data


def parse_run_directory(dirpath: Path) -> list[tuple[UsageRecord, dict[str, Any]]]:
    """Parse all JSON files in a directory into UsageRecords.

    Skips .failed files and files that fail to parse.
    """
    results = []
    if not dirpath.exists():
        return results

    for fp in sorted(dirpath.glob("*.json")):
        if fp.name.endswith(".failed"):
            continue
        parsed = parse_run_file(fp)
        if parsed:
            results.append(parsed)

    return results


def log_usage(
    record: UsageRecord,
    log_file: Path,
    *,
    extra: dict[str, Any] | None = None,
) -> None:
    """Append a usage record as one JSON line to a JSONL log file."""
    entry = record.to_dict()
    entry["timestamp"] = datetime.now(timezone.utc).isoformat()
    if extra:
        entry.update(extra)

    log_file.parent.mkdir(parents=True, exist_ok=True)
    with open(log_file, "a") as f:
        f.write(json.dumps(entry) + "\n")
