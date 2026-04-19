# Research Questions — Caveman Audit

## What We're Testing

The [Caveman plugin](https://github.com/ytchou/caveman) injects a system prompt instructing Claude to respond tersely — dropping articles, filler words, and pleasantries while preserving all technical substance. The audit measures whether this actually reduces output tokens, at what cost, and whether quality holds.

---

## Primary Questions

### Q1: Does Caveman reduce output tokens?

Compare `output_tokens` between `caveman` and `baseline` runs on identical prompts.

- **Metric:** mean output tokens per condition
- **Signal:** caveman < baseline → compression working
- **Expected:** yes, measurably

### Q2: What is the net cost delta?

Caveman injects ~1000 extra input tokens (system prompt). Does the output reduction offset this?

- **Metric:** `cost_usd` (API-equivalent, used as normalized comparison)
- **Signal:** caveman cost < baseline cost → net savings
- **Caveat:** `cost_usd` is not actual billing on subscription plans; used as compute-effort proxy

### Q3: Is the effect consistent across runs?

With N=10 runs per condition per task, measure variance.

- **Metric:** `std(output_tokens)` per condition
- **Signal:** low std → Caveman effect is reliable, not noise

### Q4: Does the effect vary by task type?

Three tasks span different output types: explanation, debugging, implementation.

- **Metric:** output token delta broken out by task
- **Signal:** some tasks compress more than others → actionable guidance on where Caveman helps most

---

## Secondary Questions

### Q5: Does context size affect Caveman's efficacy?

As input context grows (1k → 5k → 20k → 50k tokens), does output compression change?

- **Setup:** `pad_prompt()` inflates prompt to target token counts; same base task run at each level
- **Metric:** x = `total_input_tokens`, y = output token savings %
- **Hypothesis:** Caveman effect is prompt-independent — savings % stays roughly constant

### Q6: Does result quality suffer?

Terse output may drop useful content, not just filler.

- **Setup:** human rating post-hoc (Track A), batch rating in Phase 2
- **Metric:** 1–5 quality score, rated blind (condition hidden)
- **Signal:** caveman quality ≥ baseline → compression is safe

### Q7: Does tool call behavior change?

Does Caveman's terse mode affect how many tool calls Claude makes?

- **Metric:** `total_tool_calls`, `tool_calls` breakdown by type (via `stream-json` format)
- **Signal:** fewer tool calls with Caveman → model working more efficiently, or cutting corners

### Q8: Do interactive (Track A) and automated (Track B) results agree?

Validates that automated measurement generalizes to real interactive usage.

- **Metric:** compare output token delta across tracks for same tasks
- **Signal:** same direction + similar magnitude → Track B results are representative

---

## Tasks

See [data/tasks/](data/tasks/) for full prompts. Three tasks chosen to cover distinct output types:

### `react_error_boundary` — Implementation

Implement a TypeScript React error boundary component with specific requirements (error catch, fallback UI, reset button, console logging).

**Why this task:** Pure code generation. Long, structured output. Tests whether Caveman compresses implementation responses without dropping required features.

### `fix_auth_middleware` — Debug + Fix

Given a buggy Express JWT middleware (off-by-one on token expiry), identify the bug, fix it, and add error handling.

**Why this task:** Mixed output — code + explanation. Tests whether Caveman compresses the prose explanation while keeping the code correct. The bug is subtle enough to require real reasoning.

### `explain_rerender` — Explanation

Explain React re-render causes and prevention across four specific subtopics, with a concrete before/after example.

**Why this task:** Prose-heavy, no code correctness requirement. Highest compression potential. Tests whether Caveman produces a genuinely shorter explanation or just drops important detail.

---

## Design

| Variable | Values |
|----------|--------|
| Track | A (interactive), B (automated) |
| Condition | baseline, caveman |
| Task | react_error_boundary, fix_auth_middleware, explain_rerender |
| Runs per cell | 10 |

- **Track B total:** 3 tasks × 2 conditions × 10 runs = 60 runs
- **Track A total:** 3 tasks × 2 conditions × 10 sessions = 60 sessions
- Each run is a fresh session — no context carryover between runs
