# Metrics Reference — Claude Code JSON Output

Generated from real test runs on 2026-04-19 during Phase 1 instrumentation.

## Output Format: `--output-format json`

Single JSON object returned on exit. Full schema:

```json
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "api_error_status": null,
  "duration_ms": 2734,
  "duration_api_ms": 2680,
  "num_turns": 1,
  "result": "4",
  "stop_reason": "end_turn",
  "session_id": "212ee137-...",
  "total_cost_usd": 0.04606325,
  "usage": {
    "input_tokens": 3,
    "cache_creation_input_tokens": 6403,
    "cache_read_input_tokens": 11809,
    "output_tokens": 5,
    "server_tool_use": {
      "web_search_requests": 0,
      "web_fetch_requests": 0
    },
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 6403,
      "ephemeral_5m_input_tokens": 0
    },
    "inference_geo": "",
    "iterations": [
      {
        "input_tokens": 3,
        "output_tokens": 5,
        "cache_read_input_tokens": 11636,
        "cache_creation_input_tokens": 6405,
        "cache_creation": {
          "ephemeral_5m_input_tokens": 0,
          "ephemeral_1h_input_tokens": 6405
        },
        "type": "message"
      }
    ],
    "speed": "standard"
  },
  "modelUsage": {
    "claude-opus-4-6": {
      "inputTokens": 3,
      "outputTokens": 5,
      "cacheReadInputTokens": 11809,
      "cacheCreationInputTokens": 6403,
      "webSearchRequests": 0,
      "costUSD": 0.04606325,
      "contextWindow": 200000,
      "maxOutputTokens": 64000
    }
  },
  "permission_denials": [],
  "terminal_reason": "completed",
  "fast_mode_state": "off",
  "uuid": "0aacc9ab-..."
}
```

## Field Descriptions

### Top-Level

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Always "result" |
| `subtype` | string | "success" or error subtype |
| `is_error` | bool | Whether the run errored |
| `duration_ms` | int | Total wall-clock time (ms) |
| `duration_api_ms` | int | Time spent in API calls (ms) |
| `num_turns` | int | Number of conversation turns |
| `result` | string | The text output |
| `stop_reason` | string | "end_turn", "stop_sequence", etc. |
| `total_cost_usd` | float | Total API cost in USD |
| `terminal_reason` | string | "completed", "max_turns", etc. |

### `usage` Object

| Field | Type | Description |
|-------|------|-------------|
| `input_tokens` | int | Non-cached input tokens |
| `cache_creation_input_tokens` | int | Tokens written to cache |
| `cache_read_input_tokens` | int | Tokens read from cache |
| `output_tokens` | int | Output tokens (includes thinking — NOT broken out) |
| `server_tool_use` | object | Web search/fetch counts |
| `iterations` | array | Per-turn token breakdown |

### `modelUsage` Object

Per-model breakdown (key = model ID):

| Field | Type | Description |
|-------|------|-------------|
| `inputTokens` | int | Non-cached input |
| `outputTokens` | int | Output (includes thinking) |
| `cacheReadInputTokens` | int | Cache reads |
| `cacheCreationInputTokens` | int | Cache writes |
| `costUSD` | float | Cost for this model |
| `contextWindow` | int | Model context window |
| `maxOutputTokens` | int | Max output for model |

### `iterations` Array

Each entry represents one API call / turn:

| Field | Type | Description |
|-------|------|-------------|
| `input_tokens` | int | Non-cached input for this turn |
| `output_tokens` | int | Output for this turn |
| `cache_read_input_tokens` | int | Cache reads for this turn |
| `cache_creation_input_tokens` | int | Cache writes for this turn |
| `type` | string | "message" or "tool_result" |

## Key Limitations

1. **No thinking token breakdown** — `output_tokens` includes thinking tokens but does not separate them. Cannot directly test "thinking tokens untouched" claim.

2. **No per-tool-call data** in `json` format — tool calls are not itemized. Use `stream-json` format for per-event tool_use data (more complex to parse).

3. **Cache tokens dominate input** — most input tokens come from system prompt / CLAUDE.md cache. `input_tokens` (non-cached) is a small fraction of total context.

## Caveman Toggle Mechanism

- **Caveman ON (default):** Plugin auto-activates via SessionStart hook
- **Caveman OFF:** Pass `--settings '{"enabledPlugins":{"caveman@caveman":false}}'`

Verified: with disabled setting, no Caveman hook fires and plugin is not loaded.

## Output Format: `--output-format stream-json`

Requires `--verbose` flag. Returns newline-delimited JSON events:

1. `{"type":"system","subtype":"hook_started",...}` — hook lifecycle
2. `{"type":"system","subtype":"hook_response",...}` — hook output (contains Caveman prompt injection)
3. `{"type":"system","subtype":"init",...}` — session init with tools, plugins, model info
4. `{"type":"assistant","message":{...},...}` — model response with raw API usage
5. `{"type":"result",...}` — final summary (same as `json` format)

Use `stream-json` when you need: tool call details, hook behavior verification, or per-message API response data.

## Metrics Available for Audit

| Metric | Available? | Source |
|--------|-----------|--------|
| Output tokens | Yes | `usage.output_tokens` |
| Input tokens (non-cached) | Yes | `usage.input_tokens` |
| Input tokens (total w/ cache) | Yes | sum of input + cache_creation + cache_read |
| Thinking tokens | No (included in output_tokens) | — |
| Tool call count | Partial | `num_turns` proxy; `stream-json` for details |
| Duration | Yes | `duration_ms`, `duration_api_ms` |
| Cost | Yes | `total_cost_usd` |
| Result text | Yes | `result` |
| Result length | Yes | `len(result)` |
| Model used | Yes | `modelUsage` keys |
| Per-turn breakdown | Yes | `usage.iterations` |
