# Track A Protocol — Interactive Claude Code Sessions

## Overview

60 manual sessions: 3 tasks × 2 conditions × 10 runs.
Each session is a fresh Claude Code instance with the same prompt.

## Setup (Once)

1. Ensure Caveman plugin is installed: `claude plugin marketplace add caveman`
2. Verify plugin loads: start Claude Code, check for "CAVEMAN MODE ACTIVE" in status

## Per-Session Protocol

### 1. Start Fresh Session

```bash
claude --name "audit_{task}_{condition}_{run_num}" --output-format json
```

The `--output-format json` flag captures metrics even in interactive mode (outputs JSON to stdout on exit alongside the interactive UI).

**If this doesn't work in interactive mode** (Phase 1 finding needed), use `/cost` at end of session and record manually.

### 2. Condition Setup

- **Baseline:** Run `/caveman off` or `stop caveman` immediately to disable Caveman if it auto-activates
- **Caveman:** Let Caveman auto-activate (default `full` mode) — confirm "CAVEMAN MODE ACTIVE" visible

### 3. Give Prompt

Paste the exact prompt from `data/tasks/{task_name}.txt`. Do not modify or add context.

### 4. Let Claude Complete

- Do NOT interrupt or redirect
- Let Claude finish naturally (hit stop_reason = end_turn)
- If Claude asks a clarifying question, respond: "Use your best judgment and proceed."

### 5. Capture Metrics

At session end, record:

| Metric | How to Capture |
|--------|---------------|
| Output tokens | From JSON output or `/cost` |
| Input tokens | From JSON output or `/cost` |
| Total cost | From JSON output or `/cost` |
| Number of turns | Count from transcript |
| Tool calls | Count from transcript (by type: Bash, Edit, Read, etc.) |
| Duration | Wall clock time (start/end timestamps) |
| Result quality | Rate post-hoc in batch (Phase 2 Task 6) |

### 6. Save Session Data

Save to `data/runs/track_a/{task}_{condition}_{run_num}.json` with:

```json
{
  "task": "react_error_boundary",
  "condition": "caveman",
  "run_num": 3,
  "timestamp": "2026-04-20T14:30:00Z",
  "wall_clock_sec": 45,
  "num_turns": 4,
  "tool_calls": {
    "Bash": 1,
    "Edit": 2,
    "Read": 1,
    "Write": 1
  },
  "metrics_from": "manual",
  "notes": ""
}
```

If JSON output is available from `--output-format json`, merge those fields in.

## Randomization

Within each task, randomize the order of baseline vs Caveman runs. Use:

```bash
python3 -c "
import random
runs = [('baseline', i) for i in range(1,11)] + [('caveman', i) for i in range(1,11)]
random.shuffle(runs)
for c, n in runs: print(f'{c}_{n:03d}')
"
```

## Session Naming Convention

Format: `audit_{task}_{condition}_{NNN}`

Examples:
- `audit_react_error_boundary_baseline_001`
- `audit_fix_auth_middleware_caveman_007`
- `audit_explain_rerender_baseline_003`

## Open Questions (To Validate in Pilot)

1. Does `--output-format json` work with interactive (non `-p`) mode?
2. Can we capture `/cost` output programmatically?
3. Does session transcript get saved anywhere we can parse?
4. How to reliably disable Caveman mid-session for baseline runs?

These should be answered during the pilot runs (Phase 2 Task 4).
