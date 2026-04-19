"""Data models for Claude Code usage tracking."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field


@dataclass
class UsageRecord:
    """Flat representation of one Claude Code run's token usage and metrics."""

    input_tokens: int = 0
    output_tokens: int = 0
    cache_creation_tokens: int = 0
    cache_read_tokens: int = 0
    total_input_tokens: int = 0
    effective_input_tokens: float = 0.0

    num_turns: int = 0
    num_iterations: int = 0

    duration_ms: int = 0
    duration_api_ms: int = 0
    cost_usd: float = 0.0

    model: str = ""
    stop_reason: str = ""
    result_length: int = 0
    session_id: str = ""
    is_error: bool = False

    tool_calls: dict[str, int] = field(default_factory=dict)
    total_tool_calls: int = 0
    used_agent: bool = False

    def to_dict(self) -> dict:
        return asdict(self)
