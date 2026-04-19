# Research Questions — Caveman Audit

## What We're Testing

The [Caveman plugin](https://github.com/JuliusBrussee/caveman) injects a system prompt instructing Claude to respond tersely — dropping articles, filler words, and pleasantries while preserving all technical substance. The audit measures whether this actually reduces output tokens, at what cost, across different harnesses (direct API vs Claude Code), and how the effect scales with input context size.

---

## Three-track design

Three tracks isolate different dimensions of the Caveman effect.

| Track | Harness | Baseline system prompt | Role |
|---|---|---|---|
| **A** | Anthropic API direct (`anthropic` SDK) | `"You are a helpful assistant."` (~6 tok) | Default / author's setup. Reproduces claim. |
| **B** | Claude Code CLI (`claude -p`) | Full Claude Code context (~18k tok) | Harness variation. Same prompts, different runtime. |
| **C** | Both — padded context | Varied from ~30 → ~80k tok | Context sweep. Measures compression vs input size curve. |

Tracks A and B share the same 10 prompts (from [`data/fixtures/prompts.json`](data/fixtures/prompts.json)), same model (`claude-sonnet-4-6`), same trial count. Only harness differs. Track C uses a subset of those prompts at varied context sizes.

---

## Primary Questions

### Q1: Does Caveman reduce output tokens under author's methodology?

Reproduce author's claim on direct API with minimal baseline.

- **Track:** A
- **Metric:** median `output_tokens` per condition per task
- **Signal:** caveman < baseline → compression working
- **Comparison:** match author's per-task savings % within ±10pp

### Q2: Does the effect survive inside Claude Code CLI?

Same prompts, same model, same trial count — only harness changes.

- **Track:** B
- **Metric:** output token delta (caveman − baseline) per task, Welch t-test
- **Signal:** caveman < baseline at p<0.05 → effect generalizes across harnesses
- **Hypothesis:** effect smaller or absent under CLI (~18k baseline system) vs API (~6 tok baseline)

### Q3: How does compression scale with baseline context size?

If the effect exists at minimal context (Track A) but vanishes at 18k (Track B), what does the curve look like between?

- **Track:** C
- **Setup:**
  - **API leg:** 5 log-spaced context levels from ~30 → ~18k tok, padded via prepended filler
  - **CLI leg:** 5 log-spaced levels from ~18k → ~80k tok, padded via `CLAUDE.md` filler
  - Overlap point at ~18k — both harnesses at same input size
- **Metric:** x = measured `total_input_tokens`, y = output savings %
- **Hypothesis:** monotonic decay. Compression strongest at minimal context, weakens as input grows
- **Alternative:** step discontinuity at CC system prompt boundary → harness itself matters beyond size

### Q4: Does the harness add effect beyond context size?

The overlap point in Track C (API padded to 18k vs CLI at native 18k) is a direct control.

- **Metric:** output savings % at matched input token counts
- **Signal:**
  - Match → harness irrelevant. Context size dominant. Effect purely dilution-driven.
  - Diverge → CC system prompt has specific suppression beyond token volume. Content shape matters, not just size.

---

## Secondary Questions

### Q5: Does the effect vary by task type?

10 tasks span debugging, bugfix, explanation, refactor, architecture, code-review, devops, implementation.

- **Tracks:** A, B
- **Metric:** per-task output delta
- **Signal:** prose-heavy tasks (explanation, architecture) compress more than code-heavy ones (implementation, refactor) → Caveman's `BOUNDARIES: Code/commits/PRs written in normal English` rule observable in data

### Q6: Is the effect consistent across runs?

At n=10 runs per cell, measure variance.

- **Tracks:** A, B
- **Metric:** `std(output_tokens)` per condition per task
- **Signal:** low std relative to mean delta → reliable effect, not noise

### Q7: What is the net cost delta?

Caveman adds ~1000 input tokens (SKILL.md system). Output savings must offset to be net positive.

- **Tracks:** A, B
- **Metric:** `cost_usd` (API-equivalent; normalized proxy — not actual billing on subscription plans)
- **Signal:** caveman cost < baseline cost → net savings
- **Note:** `cost_usd` absent from direct API output (Track A). Compute from token counts + published pricing

### Q8: Does result quality suffer?

Terse output may drop useful content, not just filler.

- **Tracks:** A, B (manual review of sample)
- **Metric:** blind 1–5 quality score on subset
- **Signal:** caveman quality ≥ baseline → compression safe

---

## Tasks

10 prompts from author's benchmark, frozen at upstream commit `84cc3c14fa1e`. See [`data/fixtures/prompts.json`](data/fixtures/prompts.json), provenance in [`data/fixtures/PROVENANCE.md`](data/fixtures/PROVENANCE.md).

| Task | Category |
|---|---|
| `react-rerender` | debugging |
| `auth-middleware-fix` | bugfix |
| `postgres-pool` | setup |
| `git-rebase-merge` | explanation |
| `async-refactor` | refactor |
| `microservices-monolith` | architecture |
| `pr-security-review` | code-review |
| `docker-multi-stage` | devops |
| `race-condition-debug` | debugging |
| `error-boundary` | implementation |

**Why author's prompts:** direct reproducibility. Track A becomes a faithful replication of the original benchmark. Track B becomes a paired variation (only harness differs), enabling clean attribution of the delta to harness rather than prompt mix. Track C subsets these 10 for context sweep (high/med/low compression picks from Track A results).

---

## Design

| Variable | Track A | Track B | Track C (API leg) | Track C (CLI leg) |
|---|---|---|---|---|
| Harness | API direct | CC CLI | API direct | CC CLI |
| Prompts | All 10 | All 10 | Subset (3, TBD) | Subset (3, TBD) |
| Context levels | 1 (native) | 1 (native ~18k) | 5 log-spaced, ~30 → ~18k | 5 log-spaced, ~18k → ~80k |
| Conditions | baseline, caveman | baseline, caveman | baseline, caveman | baseline, caveman |
| Runs per cell | 10 | 10 | 10 | 10 |
| **Total runs** | 200 | 200 | 300 | 300 |

Each run is a fresh session — no context carryover between runs within a cell.

**Track C padding mechanism (pending design discussion):**
- API leg: prepend filler prose to user prompt. Simple, controlled.
- CLI leg: `CLAUDE.md` with filler (loaded as project context, closest to "enlarged system prompt"). Alternative: prior-turn `--resume` (more realistic, higher variance).

---

## Out of scope

- **Interactive multi-turn sessions.** Previously scoped as a separate track. Dropped — Track C's synthetic context accumulation covers the same hypothesis (does the effect change as context grows?) more cleanly than manual interactive runs.
- **Non-author tasks.** Sticking to author's 10 prompts keeps the claim reproduction tight. Pure-prose tasks (design docs, reviews) could extend the work but aren't needed to answer the primary questions.
- **Tool call behavior.** Originally scoped. `num_turns` median is 1 in Track B — no meaningful agent loop to analyze at this task scope.
