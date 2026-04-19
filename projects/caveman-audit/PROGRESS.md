# Progress — Caveman Audit

Last updated: 2026-04-19 (Track B results in)

## Track naming

Tracks renamed to reflect the three-track triangulation design. Old labels below.

| New | Old | Harness | Role |
|---|---|---|---|
| **A** | C | Anthropic API direct | Default / author's methodology |
| **B** | B | Claude Code CLI | Harness variation |
| **C** | (Phase 3) | Both, padded | Context-size sweep |

See [RESEARCH_QUESTIONS.md](RESEARCH_QUESTIONS.md) for full design.

## Status

- [x] Phase 1: Instrumentation (metrics extraction, Caveman toggle, output formats documented)
- [x] Phase 2a: Reusable `utils/` extracted (models.py, metrics.py, runner.py)
- [x] Phase 2b: Track A (API direct, author's methodology) — **200 runs complete, 67.3% avg savings. Claim reproduces.**
- [x] Phase 2c: Track B (Claude Code CLI, same 10 prompts as Track A) — **200 runs complete, −1.9% avg savings. Effect collapses under CC harness.**
- [ ] Phase 2d: Track C (context-size sweep) — design phase.
- [ ] Phase 3: Writeup for portfolio

## Track A: Reproduce author's benchmark (API direct)

Author's upstream benchmark claims 15–87% output savings. Track A tests whether their numbers reproduce under their exact methodology — direct API + minimal baseline system prompt.

### Methodology — verbatim port of [upstream `run.py`](https://github.com/JuliusBrussee/caveman/blob/main/benchmarks/run.py)

| Parameter | Value |
|---|---|
| Harness | `anthropic` SDK direct (not `claude -p`) |
| Baseline system | `"You are a helpful assistant."` (author's `NORMAL_SYSTEM`) |
| Caveman system | Full `SKILL.md` verbatim |
| Model | `claude-sonnet-4-6` (deviates from author's `claude-sonnet-4-20250514`) |
| `max_tokens` | 4096 |
| `temperature` | 0 |
| Trials | 10 per prompt per mode (scaled up from author's 3 for robustness) |
| Prompts | All 10 from author's `prompts.json` |

**Model deviation note:** Author used `claude-sonnet-4-20250514` (May 2025 snapshot, EOL June 2026). We run on `claude-sonnet-4-6` (current Sonnet) to match Track B model and test whether compression effect holds under newer model. If our numbers diverge from theirs, model drift becomes a candidate explanation.

### Fixtures snapshotted

`data/` — author's materials frozen at upstream commit `84cc3c14fa1e` (2026-04-18):
- `prompts.json` (sha256: `773e557f...`)
- `SKILL.md` (sha256: `f9c83a2b...`)
- `PROVENANCE.md` — records source, commit, hashes

Freezing prevents drift: if author updates SKILL.md later, our reproduction still reflects what they claimed *now*.

### Author's claimed numbers (to beat / match)

| Task | Normal | Caveman | Saved |
|------|-------:|--------:|------:|
| React re-render | 1180 | 159 | 87% |
| Auth middleware fix | 704 | 121 | 83% |
| Postgres pool | 2347 | 380 | 84% |
| Git rebase vs merge | 702 | 292 | 58% |
| Callback → async | 387 | 301 | 22% |
| Microservices vs monolith | 446 | 310 | 30% |
| PR security review | 678 | 398 | 41% |
| Docker multi-stage | 1042 | 290 | 72% |
| Postgres race condition | 1200 | 232 | 81% |
| React error boundary | 3454 | 456 | 87% |
| **Average** | **1214** | **294** | **65%** |

### Decision framework

| Outcome | Interpretation |
|---|---|
| Our numbers match theirs (±10%) | Claim valid in isolated API calls. Strengthens Track B finding — "effect exists, but gets diluted in Claude Code." |
| Our numbers lower than theirs | Partial reproduction. Possibly model drift (they used May 2025 Sonnet snapshot) or prompt sensitivity. Flag caveat. |
| No effect at all | Claim doesn't reproduce even in isolation. Escalates to failed replication — bigger portfolio story. |

### Results (n=10 per condition per task, 200 runs total)

Model: `claude-sonnet-4-6`. Methodology: verbatim port of author's `run.py`.

| Task | Base median | Caveman median | Saved | Author saved | Δ vs author |
|------|------------:|---------------:|------:|-------------:|------------:|
| react-rerender | 872 | 231 | 73.5% | 86.5% | −13.0pp |
| auth-middleware-fix | 1082 | 210 | 80.6% | 82.8% | −2.3pp |
| postgres-pool | 1985 | 686 | 65.4% | 83.8% | −18.4pp |
| git-rebase-merge | 928 | 413 | 55.5% | 58.4% | −2.9pp |
| async-refactor | 567 | 292 | 48.5% | 22.2% | +26.3pp |
| microservices-monolith | 1452 | 580 | 60.1% | 30.5% | +29.6pp |
| pr-security-review | 854 | 574 | 32.7% | 41.3% | −8.6pp |
| docker-multi-stage | 2450 | 456 | 81.4% | 72.2% | +9.2pp |
| race-condition-debug | 1400 | 527 | 62.4% | 80.7% | −18.3pp |
| error-boundary | 3777 | 1058 | 72.0% | 86.8% | −14.8pp |
| **AVG of medians** | **1537** | **503** | **67.3%** | **75.8%** | **−8.5pp** |

### Verdict

Claim **reproduces**. Avg 67.3% vs author's 75.8% (−8.5pp). All 10 tasks show compression, direction matches author on 10/10. Falls into "match ±10pp" bucket.

**Caveman works as advertised — in isolation.** Effect real under direct API + minimal baseline.

### Task-level anomalies

- `async-refactor`, `microservices-monolith`: we saved *more* than author (+26–30pp). Sonnet 4.6 may produce verboser baselines than May 2025 snapshot on prose-heavy prompts.
- `postgres-pool`, `race-condition-debug`, `error-boundary`: we undershoot by ~15–18pp. Author's Caveman output suspiciously short (159–456 tokens at n=3) — possible n=3 outlier on their side.
- Overall direction-consistent; magnitude variance within n=3 vs n=10 noise bounds.

### Cost note

Track A uses Anthropic API credits (pay-per-call), not Claude Code subscription. Actual cost n=10 run: ~$2–3 at Sonnet 4.6 pricing ($3/MTok input, $15/MTok output).

## Track B: Claude Code CLI (same prompts, different harness)

Track B mirrors Track A's design with only the harness changed — `claude -p` subprocess instead of `anthropic` SDK direct. Baseline system prompt becomes Claude Code's native ~18k-token context. Caveman enters as a plugin toggle (`enabledPlugins`) rather than a system-string replacement.

### Methodology

| Parameter | Value |
|---|---|
| Harness | `claude -p --output-format json` subprocess (parallel via `ThreadPoolExecutor`) |
| Baseline condition | Full Claude Code context; Caveman plugin **disabled** via `{"enabledPlugins": {"caveman@caveman": false}}` |
| Caveman condition | Full Claude Code context; Caveman plugin **enabled** (default) |
| Config dir | `~/.claude-clean` (isolated — no user CLAUDE.md pollution) |
| Model | `claude-sonnet-4-6` (matches Track A) |
| Trials | 10 per prompt per mode |
| Prompts | Same 10 as Track A (`data/prompts.json`) |

### Status

- [x] `scripts/run_track_b.py` rewritten to use Track A's 10 prompts (was 3 custom prompts)
- [x] Shared config extracted to `scripts/_config.py` (DRY between Track A and B)
- [x] Stale 3-task data (300 runs, `explain_rerender` / `fix_auth_middleware` / `react_error_boundary`) discarded
- [x] Rerun complete: n=10 × 10 prompts × 2 conditions = 200 runs
- [x] Results table vs Track A (apples-to-apples) — see below

### Results (n=10 per condition per task, 200 runs total)

Model: `claude-sonnet-4-6`. Harness: `claude -p --output-format json`, isolated config dir (`~/.claude-clean`), Caveman toggled via `enabledPlugins`.

| Task | Base median | Caveman median | Saved (B) | Saved (A) | Δ B vs A |
|------|------------:|---------------:|----------:|----------:|---------:|
| async-refactor | 165 | 201 | −21.8% | 48.5% | −70.3pp |
| auth-middleware-fix | 395 | 348 | +11.9% | 80.6% | −68.7pp |
| docker-multi-stage | 402 | 394 | +1.9% | 81.4% | −79.5pp |
| error-boundary | 543 | 762 | −40.3% | 72.0% | −112.3pp |
| git-rebase-merge | 424 | 434 | −2.2% | 55.5% | −57.7pp |
| microservices-monolith | 353 | 366 | −3.8% | 60.1% | −63.9pp |
| postgres-pool | 502 | 448 | +10.9% | 65.4% | −54.6pp |
| pr-security-review | 433 | 351 | **+19.0%** | 32.7% | −13.7pp |
| race-condition-debug | 510 | 493 | +3.3% | 62.4% | −59.0pp |
| react-rerender | 437 | 425 | +2.7% | 73.5% | −70.8pp |
| **AVG of medians** | **476** | **422** | **−1.9%** | **63.2%** | **−65.1pp** |

### Verdict

**Effect collapses.** Track A avg 63.2% → Track B avg −1.9%. On 4/10 tasks Caveman produces *more* output than baseline. Only `pr-security-review` retains meaningful positive savings (+19%).

This is a stronger portfolio story than "Caveman works" — author's claim is methodology-dependent, not harness-invariant.

### Key finding: baselines already compressed in CC harness

Per-task, Track B baseline output is systematically shorter than Track A baseline output (same prompt, same model, only harness differs).

| Task | A baseline median | B baseline median | B_base shorter by | Caveman B saved |
|---|--:|--:|--:|--:|
| error-boundary | 3777 | 543 | 85.6% | −40.3% |
| docker-multi-stage | 2450 | 402 | 83.6% | +1.9% |
| microservices-monolith | 1452 | 353 | 75.7% | −3.8% |
| postgres-pool | 1985 | 502 | 74.7% | +10.9% |
| async-refactor | 567 | 165 | 70.9% | −21.8% |
| race-condition-debug | 1400 | 510 | 63.6% | +3.3% |
| auth-middleware-fix | 1082 | 395 | 63.5% | +11.9% |
| git-rebase-merge | 927 | 424 | 54.3% | −2.2% |
| react-rerender | 872 | 437 | 50.0% | +2.7% |
| pr-security-review | 853 | 433 | 49.3% | **+19.0%** |

The tasks CC shortens most (error-boundary, docker-multi-stage) are where Caveman's Track B effect is smallest or most negative. The task CC shortens least (pr-security-review) is where Caveman retains the most headroom.

### Working hypothesis

**Caveman and CC both push toward terse responses. Their effects do not stack — they overlap.** Whatever in CC's ~18k-token harness context shortens responses (instructions, framing, tool definitions — cause unknown) already consumes most of the compression headroom Caveman would exploit.

- Where CC shortens hard (code-heavy tasks) → Caveman adds nothing or interferes
- Where CC shortens less (review/explanation prose) → Caveman still has room, but far less than Track A

**Category hypothesis — partial support:**

In Track A, code-heavy tasks (devops, bugfix, implementation) were highest savers (72–81%). I initially framed this as "Caveman wins on code-heavy tasks." Track B reveals a subtler mechanism: Caveman wins on code-heavy tasks *when nothing else is compressing them*. In CC's harness, the baseline already strips the framing Caveman would have stripped. Low savers in Track A (code-review, refactor) remain low in B, but for a different reason: those tasks need qualifying prose regardless of harness.

### Open questions for Track C

1. **Does the curve smooth from 67% → −2% as context pads from ~30 tok to ~18k?** Track C Leg 1 (API, padded) answers this.
2. **Is the mechanism token volume or content shape?** If `API @ 18k filler prose` ≠ `CLI @ 18k native` at the Leg overlap point, CC's content does something filler doesn't. Volume alone wouldn't explain it.
3. **Does `pr-security-review` retain its edge across all Track C context levels, or is that a spurious Track B anomaly?**

### Stale Track B data (discarded)

Previous Track B used 3 custom coding prompts that didn't match Track A. Results summary retained here as a footnote:

> n=50 per cell, 300 runs total. No task reached statistical significance on output tokens (p<0.05). Effect size <2% across all cases, inconsistent direction. Mean output deltas: `explain_rerender` +7 tok (+0.6%), `fix_auth_middleware` −72 tok (−6.6%), `react_error_boundary` +8 tok (+1.3%).

Conclusion: no detectable compression, but task mix wasn't shared with Track A so direct comparison impossible. Rerun uses Track A's 10 prompts for clean attribution.

## Track C: Context-size sweep (NEW — design phase)

Track A shows 67% savings at ~30 tok baseline system. Track B (projected) will anchor at ~18k. Track C fills the curve between — and extends beyond — to answer **does compression degrade smoothly with context size, or stepwise at the CC boundary?**

### Hypothesis

Caveman's compression strength is inversely proportional to baseline context size. As the Caveman SKILL.md's share of total input shrinks, the terse-prompting signal dilutes below noise floor.

- **Monotonic decay** → dilution confirmed. Plugin value scales with how "clean" the Claude's starting context is.
- **Step discontinuity at ~18k** → CC system prompt has specific suppression beyond token volume (content shape, not just size).

### Design

Two legs, meeting at ~18k tokens (Claude Code's native baseline).

**Leg 1 — API direct, padded context:**
- Start: Track A setup (~30 tok system, ~50 tok prompt)
- Pad user prompt with filler prose to hit 5 log-spaced target input sizes
- Proposed levels: **100, 500, 2,000, 7,000, 18,000** tokens
- Overlaps Track B at 18k

**Leg 2 — Claude Code CLI, padded context:**
- Start: Track B setup (~18k native)
- Pad via `CLAUDE.md` with filler content to push input higher
- Proposed levels: **18,000, 30,000, 50,000, 75,000, 120,000** tokens
- Tests extrapolation past CC native size

**Subset prompts (TBD):** 3 of 10, picked to span Track A's compression range:
- High: `error-boundary` (72%)
- Med: `async-refactor` (48%)
- Low: `pr-security-review` (33%)

### Scale

| Leg | Levels | Prompts | Conditions | Runs/cell | Total |
|---|---|---|---|---|---|
| API | 5 | 3 | 2 | 10 | 300 |
| CLI | 5 | 3 | 2 | 10 | 300 |
| | | | | **Combined** | **600** |

### Open design questions (pending discussion)

1. **Padding content fidelity.** Generic filler prose ≠ real CC system prompt (tool defs, instructions, examples). Options:
   - Generic repeated technical docs — cheap, less realistic
   - Leaked/reverse-engineered CC system prompt — higher fidelity
   - Both, compared
2. **CLI padding mechanism.** Options:
   - `CLAUDE.md` with filler (closest to "enlarged system prompt")
   - User-prompt prepend (different cache path than system)
   - `--resume SESSION_ID` after prior turns (realistic, high variance)
3. **Overlap validation.** If API @ 18k ≠ CLI @ 18k, diagnostic steps: compare cache hit/miss split, content shape, system-vs-user placement.

## Three-track triangulation

| Track | Harness | Baseline system | n per cell | Caveman savings |
|---|---|---|---|---|
| Author | Anthropic API direct | `"You are a helpful assistant."` | 3 | 75.8% |
| A (ours) | Anthropic API direct | `"You are a helpful assistant."` | 10 | **67.3%** |
| B (ours) | Claude Code CLI | Full Claude Code context (~18k tok) | 10 | **−1.9%** |
| C (ours) | Both, padded | Varied (~30 → ~120k tok) | 10 | **TBD** (curve) |

Author's claim holds at minimal baseline. Under CC harness the effect vanishes (−1.9% avg, 4/10 tasks negative). Track C measures the curve connecting them — and extends past.

## Scripts

- `scripts/_config.py` — shared constants and helpers (prompts path, model, retry, workers)
- `scripts/run_track_a.py` — Anthropic API direct, author's benchmark (previously `run_track_c.py`)
- `scripts/run_track_b.py` — parallel `claude -p` headless runner (tqdm progress, retry, env config)
- `scripts/run_track_c.py` — context-size sweep (not yet written)
- `scripts/parse_results.py` — unified DataFrame across all tracks → `data/results.csv`

**Note:** `run_track_c.py` is the legacy name for what is now `run_track_a.py` (Track A = author's API-direct methodology). Will rename after Track B rerun completes.

## Data

- `data/` — author's inputs: `prompts.json`, `SKILL.md`, `PROVENANCE.md`
- `outputs/runs/track_a/` — 200 JSON files (n=10 × 10 prompts × 2 conditions)
- `outputs/runs/track_b/` — 200 runs pending regen summary.
- `outputs/runs/track_c/` — context sweep (not yet populated)
- `outputs/results.csv` — flattened, track-tagged, regenerates from all `track_*/` dirs via `parse_results.py`
- `outputs/` — gitignored. All generated files live here.
