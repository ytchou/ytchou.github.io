# Progress — Caveman Audit

Last updated: 2026-04-19

## Track naming

Tracks renamed to reflect the three-track triangulation design. Old labels below.

| Track | Harness | System prompt | API params | Tasks | Runs/condition | Role |
|---|---|---|---|---|---|---|
| **A** | Anthropic API | Minimal (6 tok) | Author's: temp=0, max=4096, no thinking | 10 | 10 | Reproduce author's benchmark |
| **A'** | Anthropic API | Minimal (6 tok) | CC-matched: thinking ON (4K), max=16384, temp=1.0 | 10 | 5 | Isolate parameter confounds |
| **B** | CC CLI (`claude -p`) | Full CC context (~18K) | CC defaults (thinking ON, temp=1.0) | 10 | 10 | Real-world CC harness |
| **C** | Anthropic API | Incremental CC content (6 levels) | CC-matched: thinking ON (4K), max=16384, temp=1.0 | 3 | 5 orderings | Context-size sweep |

See [RESEARCH_QUESTIONS.md](RESEARCH_QUESTIONS.md) for full design.

## Status

- [x] Phase 1: Instrumentation (metrics extraction, Caveman toggle, output formats documented)
- [x] Phase 2a: Reusable `utils/` extracted (models.py, metrics.py, runner.py)
- [x] Phase 2b: Track A — **200 runs complete, 63.1% avg savings. Claim reproduces.**
- [x] Phase 2c: Track B — **200 runs complete, −1.9% avg savings. Effect collapses under CC harness.**
- [x] Phase 2d: Track A' — **100 runs complete, 50.6% avg savings. Parameters account for ~12.6pp of the A→B gap.**
- [x] Phase 2e: Track C — **180 runs complete. Collapse happens at behavioral block (L0), not from tool-def volume.**
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

## Track A': API direct with CC-matched parameters

Track A reproduces the author's result, but under **different API parameters than CC CLI uses**. This means the A→B gap (67% → −1.9%) conflates three things: system prompt content, tool schemas, and API parameters.

Track A' isolates the parameter effect by running the exact same harness and system prompts as Track A, but with CC CLI's default parameters.

### Parameter comparison

| Parameter | Track A (author's) | Track A' (CC-matched) | Track B (CC CLI) |
|---|---|---|---|
| Harness | Anthropic API | Anthropic API | `claude -p` CLI |
| System prompt | `"You are a helpful assistant."` | `"You are a helpful assistant."` | Full CC context (~18K) |
| `max_tokens` | 4,096 | 16,384 | ~16,384 (CC default) |
| `temperature` | 0 | omitted (1.0 default) | not configurable (1.0) |
| Extended thinking | OFF | ON (budget=4,000) | ON (CC default) |

### Results (n=5 per condition per task, 100 runs total)

Model: `claude-sonnet-4-6`. Params: thinking ON (budget=4K), max_tokens=16384, temp=1.0.

| Task | A savings | A' savings | Δ (param effect) |
|------|----------:|-----------:|-----------------:|
| async-refactor | 46.5% | 34.8% | −11.7pp |
| auth-middleware-fix | 78.8% | 19.8% | −59.0pp* |
| docker-multi-stage | 79.7% | 70.8% | −8.9pp |
| error-boundary | 70.3% | 67.7% | −2.6pp |
| git-rebase-merge | 54.8% | 44.4% | −10.4pp |
| microservices-monolith | 61.7% | 58.2% | −3.5pp |
| postgres-pool | 65.9% | 60.9% | −5.0pp |
| pr-security-review | 35.2% | 27.7% | −7.5pp |
| race-condition-debug | 65.4% | 56.0% | −9.4pp |
| react-rerender | 72.8% | 65.3% | −7.5pp |
| **AVG** | **63.1%** | **50.6%** | **−12.6pp** |

*`auth-middleware-fix` caveman std=713 in A' — one outlier run, treat with caution.

### Verdict

**Parameters matter, but aren't the main story.** Switching to CC-matched params (thinking ON, higher temp, more token headroom) reduces savings by ~12.6pp on average. Caveman still works — just less efficiently. The remaining ~50pp gap to Track B is explained by system prompt content, not params.

The A→B gap (63% → 0.7%) decomposes as:
- **~20% of gap**: API parameters (A→A': −12.6pp)
- **~80% of gap**: CC harness / system prompt (A'→B: −49.9pp)

### Status

- [x] Runner script: `scripts/run_track_a_prime.py`
- [x] Run: 100 calls (10 tasks × 2 conditions × 5 runs)
- [x] Results comparison vs Track A and Track B

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

## Track C: Context-size sweep (10-chunk shuffle experiment)

Track A shows 67% savings at ~6 tok baseline system. Track B shows −1.9% at ~18K. Track C fills the curve between to answer: **is the collapse caused by token volume (dilution) or specific CC content (interference)?**

### Hypotheses

- **Dilution:** Caveman's ~1K-token SKILL.md loses influence as total context grows, regardless of content. Pure signal-to-noise ratio.
- **Interference:** Specific CC system prompt components (tone/style, output efficiency instructions) directly counteract Caveman's compression signal.

### Methodology

| Parameter | Value |
|---|---|
| Harness | Anthropic API direct (same as Track A) |
| Padding source | Reverse-engineered CC system prompt content |
| Structure | Behavioral block (~3,500 tok, always present) + 10 tool-def chunks (~1,400 tok each, shuffled) |
| Tasks | 3: `error-boundary` (72%), `async-refactor` (48.5%), `pr-security-review` (32.7%) |
| Orderings per task | 5 (random permutations, deterministic seeds) |
| Levels | 6: behavioral only, +2/4/6/8/10 tool-def chunks |
| Conditions | 2 (baseline + caveman) |
| **Total API calls** | **180** |

**6 measurement levels:**

| Level | Content | ~System tokens |
|---|---|---|
| 0 | Behavioral block only | ~3,500 |
| 1 | Behavioral + 2 tool-def chunks | ~6,300 |
| 2 | Behavioral + 4 tool-def chunks | ~9,100 |
| 3 | Behavioral + 6 tool-def chunks | ~11,900 |
| 4 | Behavioral + 8 tool-def chunks | ~14,700 |
| 5 | Behavioral + all 10 tool-def chunks | ~17,500 |

Track A (~6 tok) and Track B (~18K tok) are the anchoring baselines. Level 0 tests whether behavioral instructions alone kill Caveman. Levels 1-5 test whether tool-def volume matters. Level 5 (~17.5K) should approximate Track B's native CC baseline.

### CC system prompt decomposition

Sliced from publicly extracted CC system prompt content (see `data/cc_slices/PROVENANCE.md`):

- **Behavioral block:** Identity, system rules, coding philosophy, executing actions with care, tool usage guidance, tone and style, output efficiency, session guidance — combined into a single file
- **Tool-def chunks 1-10:** CC's tool definitions split into 10 roughly equal chunks (~1,400 tok each), covering Bash, Edit, Read, Write, Grep, Glob, Agent, Plan/Worktree, Web tools, Task/Cron tools

### Shuffle design

Each ordering is a random permutation of tool-def chunks 0-9. At level N, the first 2N chunks from the ordering are included. Across 5 orderings per task, different chunks appear at different levels, enabling rough attribution of which chunks matter.

### Results (n=5 orderings per level per condition, 180 runs total)

Model: `claude-sonnet-4-6`. Params: thinking ON (budget=4K), max_tokens=16384, temp=1.0.

| Level | Context | async-refactor | error-boundary | pr-security-review |
|-------|---------|:--------------:|:--------------:|:------------------:|
| **A'** (no CC content) | ~6 tok | 34.8% | 67.7% | 27.7% |
| **L0** | behavioral only (~3.5K) | 9.0% | 19.9% | 12.4% |
| **L1** | +2 tool chunks (~6.3K) | 24.4% | 18.9% | 16.6% |
| **L2** | +4 tool chunks (~9.1K) | 11.7% | 23.3% | 28.8% |
| **L3** | +6 tool chunks (~11.9K) | 13.9% | 38.5% | 17.8% |
| **L4** | +8 tool chunks (~14.7K) | 15.0% | 31.1% | 2.5% |
| **L5** | +10 tool chunks (~17.5K) | 19.2% | 31.2% | 22.8% |
| **B** (CC CLI actual) | ~18K | −5.6% | −33.8% | 17.4% |

### Verdict

**The collapse happens at L0, not gradually.** Adding CC's behavioral block (tone, style, output efficiency, identity — ~3,500 tokens) causes an immediate large drop:
- async-refactor: 34.8% → 9.0% (−25.8pp)
- error-boundary: 67.7% → 19.9% (−47.8pp)
- pr-security-review: 27.7% → 12.4% (−15.3pp)

Adding tool-definition chunks (L0→L5) does **not** consistently degrade savings further — results are flat and noisy across levels. For `error-boundary`, savings actually trend upward with more context.

**The interference hypothesis is supported over dilution.** It's not token volume that kills Caveman — it's specifically CC's behavioral instructions (tone, style, output efficiency) that already instruct Claude to be concise. Caveman is redundantly issuing a compression directive to a model already told to compress.

The remaining gap between C-L5 and B for some tasks (e.g., `error-boundary`: +31% vs −34%) suggests additional CC harness effects beyond system prompt text — possibly plugin/context structure.

### Status

- [x] CC system prompt slices sourced (`data/cc_slices/`, 11 files)
- [x] Runner script complete (`scripts/run_track_c.py`)
- [x] Full run complete (180 calls)
- [x] Analysis — degradation curve confirms interference over dilution

## Three-track triangulation

| Track | Harness | Baseline system | Params | n per cell | Caveman savings |
|---|---|---|---|---|---|
| Author | API direct | `"You are a helpful assistant."` | temp=0, max=4096, no thinking | 3 | 75.8% |
| A (ours) | API direct | `"You are a helpful assistant."` | temp=0, max=4096, no thinking | 10 | **63.1%** |
| A' (ours) | API direct | `"You are a helpful assistant."` | temp=1.0, max=16384, thinking ON (4K) | 5 | **50.6%** |
| B (ours) | CC CLI | Full CC context (~18k tok) | CC defaults (≈A' params) | 10 | **−1.9%** |
| C (ours) | API direct | CC system prompt, incremental | temp=1.0, max=16384, thinking ON (4K) | 5 orderings | **9–32% (flat across levels)** |

**Gap decomposition (A→B, −63pp total):**
- Parameters (A→A'): −12.6pp (~20%)
- CC system prompt / harness (A'→B): −49.9pp (~80%)
- Behavioral block alone (A'→C-L0): ~−30pp on average; tool defs add negligible further degradation

## Scripts

- `scripts/_config.py` — shared constants, loaders, helpers (prompts, slices, model, retry)
- `scripts/run_track_a.py` — Anthropic API direct, author's benchmark reproduction (Track A)
- `scripts/run_track_a_prime.py` — API direct with CC-matched parameters (Track A')
- `scripts/run_track_b.py` — parallel `claude -p` headless runner (Track B)
- `scripts/run_track_c.py` — context-size sweep with 10-chunk shuffle (Track C)
- `scripts/parse_results.py` — unified DataFrame across all tracks → `outputs/results.csv`

## Data

- `data/prompts.json`, `SKILL.md`, `PROVENANCE.md` — author's inputs, frozen
- `data/cc_slices/` — CC system prompt decomposition (behavioral block + 10 tool-def chunks)
- `outputs/runs/track_a/` — Track A runs (200 files)
- `outputs/runs/track_a_prime/` — Track A' CC-matched parameter runs
- `outputs/runs/track_b/` — Track B CLI runs (200 files)
- `outputs/runs/track_c/` — Track C context sweep
- `outputs/results.csv` — flattened, track-tagged, regenerates via `parse_results.py`
- `outputs/` — gitignored

---

## Draft narrative (to be polished for portfolio writeup)

### The claim

Caveman is a Claude Code plugin that promises 15–87% output token savings by prepending a short compression instruction to every prompt. The author's benchmark reproduces this — across 10 coding tasks, a minimal "You are a helpful assistant" baseline averages 76% more output than the Caveman condition.

### What the benchmark hides

The author's benchmark runs the Anthropic API directly with artificial parameters: temperature=0, max_tokens=4096, and no extended thinking. These aren't Claude Code's defaults. In practice, Claude Code runs with temperature=1.0, max_tokens=16384, and extended thinking enabled. The benchmark was never tested in the environment it claims to improve.

### Replication: the numbers hold — under those same artificial conditions

We ran the author's exact methodology on 10 tasks, scaled up to n=10 per condition for robustness. Result: 63.1% average savings. Direction consistent on all 10 tasks. The claim reproduces.

### Track A': what happens with real CC parameters?

We reran the same experiment — same minimal system prompt, same tasks — but with CC-matched API parameters. Savings dropped from 63.1% to 50.6%. Parameters explain about 12.6 percentage points, or 20% of the total gap between the author's headline and real-world usage. Still a meaningful effect, but inflated.

### Track B: the real world

We ran both conditions through the actual Claude Code CLI (`claude -p`), with Caveman toggled via its plugin system. Result: −1.9% average savings. On 6 of 10 tasks, Caveman produces *more* output than the baseline. The effect doesn't just shrink — it reverses.

The key observation: Claude Code's baseline is already compressed. Where the API baseline for `error-boundary` averages 3,785 tokens, the CC baseline averages only 543 — an 85% reduction before Caveman does anything. The compression headroom Caveman depends on has already been consumed.

### Track C: what's doing the compressing?

We decomposed CC's ~18K system prompt into a behavioral block (~3,500 tokens of identity, coding philosophy, tone, style, and output efficiency rules) and 10 tool-definition chunks (~1,400 tokens each). We then progressively added content and measured Caveman's effect at each level.

The collapse is immediate. Adding just the behavioral block drops savings from ~51% (A', no CC content) to 9–20% (L0, behavioral only). Adding tool definitions (L1–L5) changes nothing meaningful — the curve is flat.

**Dilution is not the culprit. Interference is.** CC's behavioral instructions already tell Claude to be concise, terse, and efficient. Caveman is issuing a redundant instruction to a model that's already been told to compress. The tool definitions — the bulk of CC's 18K context — are irrelevant to the effect.

### The one exception

`pr-security-review` retains modest positive savings across Track B (+17%) and Track C. This task requires structured, qualifying prose that neither Caveman nor CC's behavioral block fully suppresses. It may represent a category where compression instructions genuinely add value even inside CC — but it's one task out of ten.

### Takeaway

Caveman's 15–87% claim is real, but it was measured in a vacuum. Under the actual CC environment it was built for — matching API parameters and with CC's system prompt present — the effect collapses. The reason isn't token volume or tool schemas. It's that Claude Code already applies the compression Caveman is trying to add. The plugin is solving a problem CC's own instructions have already solved.
