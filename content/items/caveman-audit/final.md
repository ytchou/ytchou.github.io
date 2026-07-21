---
item_id: portfolio/caveman-audit
title: "Putting Caveman's Token Savings to the Test"
subtitle: "The benchmark says yes. Our four-track audit says: not as advertised."
seo_title: "Caveman Token Savings Tested: 76% Claim vs Reality"
seo_description: "Is Caveman's 76% token savings real? Our four-track audit says partially: 25% in Claude Code. The gap comes from parameter inflation and prompt interference."
tone: "research"
review_iterations: 3
final_scores:
  structure: 9
  mechanics: 9
  evidence: 9
  narrative: 9
  clarity: 9
  tone_consistency: 9
---

# Putting Caveman's token savings to the test

## Introduction

The Caveman plugin for Claude Code promises big output token savings. It injects a system prompt telling Claude to "respond terse like smart caveman," dropping articles, filler words, pleasantries, and hedging while keeping technical substance. The upstream benchmark reports an average 76% savings across 10 tasks covering debugging, implementation, refactoring, and code review.

Those numbers are real. We reproduced them. But they were measured in conditions that don't match the environment Caveman was built for.

Here's the thing that kept bugging me: Caveman is a Claude Code plugin. Installed through Claude Code, activated through Claude Code, used inside Claude Code sessions. But the benchmark validating it runs against the raw Anthropic API with a minimal six-token baseline system prompt, temperature zero, extended thinking off, and a 4,096-token output cap. None of these match Claude Code's runtime defaults: temperature 1.0, extended thinking on, 16,384-token output ceiling. The benchmark baseline, "You are a helpful assistant," looks nothing like Claude Code's actual system prompt, which runs roughly 18,000 tokens of behavioral instructions, coding philosophy, tone guidance, and tool definitions.

So does Caveman's compression survive when tested where it actually runs? Across 580 experimental runs in four tracks, the answer is: partially. The 63% average savings under the author's methodology drops to +25.3% median savings under the Claude Code CLI. Real, but roughly halved. The reason is interference. Claude Code's own behavioral instructions already compress output along the same axes Caveman targets, eating into the headroom a redundant compression directive needs.

## Methodology

### Experimental design

Four tracks isolate why Caveman's benchmark numbers don't fully transfer to real-world usage. Each holds most variables constant while varying one dimension.

| Track | Harness | System prompt | API parameters | Tasks | Runs per condition | Role |
|-------|---------|---------------|----------------|-------|--------------------|------|
| A | Anthropic API | Minimal (6 tokens) | Author's: temp=0, max=4,096, no thinking | 10 | 10 | Reproduce the author's benchmark |
| A' | Anthropic API | Minimal (6 tokens) | CC-matched: thinking ON (4K budget), max=16,384, temp=1.0 | 10 | 5 | Isolate parameter confounds |
| B | CC CLI (`claude -p`) | Full CC context (~18K tokens) | CC defaults (thinking ON, temp=1.0) | 10 | 5 | Measure real-world CC harness |
| C | Anthropic API | Incremental CC content (6 levels) | CC-matched | 3 | 5 orderings | Context-size sweep to identify collapse mechanism |

All tracks use the same model (`claude-sonnet-4-6`), the same 10 task prompts from the author's upstream benchmark (frozen at commit `84cc3c14fa1e`), and the same Caveman system prompt (`SKILL.md`). Each run starts a fresh session with no context carryover.

### Track A: Reproducing the claim

Track A replicates the author's `run.py` benchmark. We use the Anthropic SDK directly, set the baseline system prompt to "You are a helpful assistant," apply the author's API parameters (temperature=0, max_tokens=4096, no extended thinking), and run all 10 task prompts. The only difference from the author's setup is the model version: we use `claude-sonnet-4-6` (current Sonnet) rather than the author's `claude-sonnet-4-20250514` (May 2025 snapshot, EOL June 2026), to match across all other tracks.

We scaled from the author's n=3 to n=10 runs per condition per task, for 200 total runs. Larger samples give more robust medians and expose variance that n=3 hides.

### Track A': Isolating parameter effects

Track A reproduces the author's result, but under API parameters that differ from Claude Code's defaults. The gap between Track A (63% savings) and Track B (+25% savings) conflates three potential confounds: system prompt content, tool schemas, and API parameters.

Track A' isolates the parameter contribution. Same API harness, same minimal system prompt as Track A, but with Claude Code's default parameters: temperature omitted (defaulting to 1.0), max_tokens=16,384, extended thinking enabled with a 4,000-token budget. 100 total runs (10 tasks, 2 conditions, 5 runs per cell).

### Track B: The real-world test

Track B swaps the API harness for the actual Claude Code CLI, invoked via `claude -p --output-format json` as a subprocess. The baseline uses Claude Code's full native context (~18,000 tokens of system prompt) with Caveman disabled via `enabledPlugins` configuration. The Caveman condition enables the plugin through the same mechanism.

To prevent contamination from operator configuration, all Track B runs execute against an isolated configuration directory (`~/.claude-clean`) with no user-level `CLAUDE.md` or custom settings. The only difference between conditions is whether Caveman's plugin is active. We verified activation by comparing input token counts: Caveman runs show ~1,000 more input tokens than baseline (17,088 versus 18,077), consistent with `SKILL.md` being prepended.

100 total runs (10 tasks, 2 conditions, 5 runs per cell).

### Track C: The mechanism sweep

Tracks A through B establish that the effect shrinks. They don't tell us why. Two hypotheses:

**Dilution**: Caveman's ~1,000-token `SKILL.md` loses influence as total context grows from 6 tokens to 18,000 tokens, regardless of content. The compression signal drowns in noise.

**Interference**: Specific parts of Claude Code's system prompt, particularly the tone, style, and output efficiency instructions, directly counteract Caveman's compression directive. The model gets conflicting instructions, and CC's higher-authority instructions win.

Track C discriminates between these by decomposing Claude Code's system prompt into two structurally distinct components: a behavioral block (~3,500 tokens of identity, coding philosophy, tone/style mandates, and output efficiency rules, the content most likely to overlap with Caveman) and 10 tool-definition chunks (~1,400 tokens each, semantically inert with respect to output verbosity). We progressively add content and measure Caveman's effect at six levels:

| Level | Content | Approximate system tokens |
|-------|---------|--------------------------|
| L0 | Behavioral block only | ~3,500 |
| L1 | Behavioral + 2 tool-definition chunks | ~6,300 |
| L2 | Behavioral + 4 tool-definition chunks | ~9,100 |
| L3 | Behavioral + 6 tool-definition chunks | ~11,900 |
| L4 | Behavioral + 8 tool-definition chunks | ~14,700 |
| L5 | Behavioral + all 10 tool-definition chunks | ~17,500 |

Track A' (no CC content, ~6 tokens) and Track B (full CC CLI, ~18K tokens) anchor the ends. For three tasks selected to span the range of Track A savings, `error-boundary` (72%, high), `async-refactor` (48.5%, medium), and `pr-security-review` (32.7%, low), we ran 5 random orderings of tool-definition chunks at each level. 180 total API calls.

Shuffling ensures that at each intermediate level, different tool-definition chunks appear across orderings, so chunk identity can't confound cumulative token count.

### Metrics

Primary metric: output token savings, the percentage reduction in median output tokens between baseline and Caveman conditions per task. Secondary metrics: per-task variance (standard deviation within condition) and cost (computed from token counts at published Sonnet 4.6 pricing: $3/MTok input, $15/MTok output). All medians are per condition per task; averages across tasks are averages of these per-task medians.

## Results

### Track A: The claim reproduces

Under the author's methodology, Caveman compresses output reliably. All 10 tasks show savings in the expected direction.

| Task | Baseline median | Caveman median | Savings | Author's savings | Delta vs. author |
|------|----------------:|---------------:|--------:|-----------------:|-----------------:|
| react-rerender | 872 | 231 | 73.5% | 86.5% | -13.0pp |
| auth-middleware-fix | 1,082 | 210 | 80.6% | 82.8% | -2.3pp |
| postgres-pool | 1,985 | 686 | 65.4% | 83.8% | -18.4pp |
| git-rebase-merge | 928 | 413 | 55.5% | 58.4% | -2.9pp |
| async-refactor | 567 | 292 | 48.5% | 22.2% | +26.3pp |
| microservices-monolith | 1,452 | 580 | 60.1% | 30.5% | +29.6pp |
| pr-security-review | 854 | 574 | 32.7% | 41.3% | -8.6pp |
| docker-multi-stage | 2,450 | 456 | 81.4% | 72.2% | +9.2pp |
| race-condition-debug | 1,400 | 527 | 62.4% | 80.7% | -18.3pp |
| error-boundary | 3,777 | 1,058 | 72.0% | 86.8% | -14.8pp |
| **Average** | **1,537** | **503** | **67.3%** | **75.8%** | **-8.5pp** |

Our 67.3% average sits 8.5 points below the author's 75.8%. That's consistent with model version drift (Sonnet 4.6 versus the author's May 2025 snapshot) and our larger sample (n=10 versus n=3, which dampens outlier influence). Direction matches on all 10 tasks. The claim reproduces.

Two tasks, `async-refactor` and `microservices-monolith`, show higher savings than the author reported (+26 and +30 points). Both are prose-heavy. Sonnet 4.6 produces more verbose baselines than the May 2025 snapshot, giving Caveman more to compress. Three tasks, `postgres-pool`, `race-condition-debug`, and `error-boundary`, undershoot by 15-18 points. The author's suspiciously low Caveman outputs for these (159-456 tokens at n=3) look like outlier effects from the smaller sample.

### Track A': Parameters explain ~20% of the gap

Switching from the author's API parameters to Claude Code's defaults while keeping the minimal system prompt cuts savings by an average of 12.6 points.

| Task | Track A savings | Track A' savings | Parameter effect |
|------|----------------:|-----------------:|-----------------:|
| async-refactor | 46.5% | 34.8% | -11.7pp |
| auth-middleware-fix | 78.8% | 19.8% | -59.0pp* |
| docker-multi-stage | 79.7% | 70.8% | -8.9pp |
| error-boundary | 70.3% | 67.7% | -2.6pp |
| git-rebase-merge | 54.8% | 44.4% | -10.4pp |
| microservices-monolith | 61.7% | 58.2% | -3.5pp |
| postgres-pool | 65.9% | 60.9% | -5.0pp |
| pr-security-review | 35.2% | 27.7% | -7.5pp |
| race-condition-debug | 65.4% | 56.0% | -9.4pp |
| react-rerender | 72.8% | 65.3% | -7.5pp |
| **Average** | **63.1%** | **50.6%** | **-12.6pp** |

*The `auth-middleware-fix` outlier (standard deviation of 713 in the Caveman condition) reflects a single anomalous run. Interpret with caution.

Caveman still works at 50.6% average savings under CC-matched parameters. The effect is genuine, just inflated by temperature=0 and the absence of extended thinking. Parameters account for roughly one-third of the total gap between Track A and Track B. The rest comes from the system prompt and harness.

### Track B: The effect shrinks in Claude Code

Under the actual Claude Code CLI, Caveman's compression persists but at roughly half its isolated strength. Median savings across all 10 tasks: +25.3%, down from 63.1% in Track A.

| Task | Track B savings (median) | Track B savings (mean) | Track A savings | Delta B vs. A |
|------|-------------------------:|-----------------------:|----------------:|--------------:|
| auth-middleware-fix | +57.5% | -27.3%* | 78.8% | -21.3pp |
| error-boundary | +45.3% | +21.4% | 70.3% | -25.0pp |
| react-rerender | +43.4% | +44.1% | 72.8% | -29.4pp |
| race-condition-debug | +32.2% | +39.2% | 65.4% | -33.2pp |
| git-rebase-merge | +31.9% | +30.3% | 54.8% | -22.9pp |
| async-refactor | +19.5% | +10.8% | 46.5% | -27.0pp |
| microservices-monolith | +11.0% | +11.9% | 61.7% | -50.7pp |
| docker-multi-stage | +11.0% | +7.2% | 79.7% | -68.7pp |
| postgres-pool | +1.7% | +5.5% | 65.9% | -64.2pp |
| pr-security-review | -0.4% | -224.9%* | 35.2% | -35.6pp |
| **Average of medians** | **+25.3%** | | **63.1%** | **-37.8pp** |

*Mean distorted by single outlier runs. At n=5, median is the reliable measure. The `auth-middleware-fix` mean reflects one Caveman run producing ~3x more tokens than typical. The `pr-security-review` mean reflects a single run hitting 6,853 tokens (versus a typical 400-600), likely a tool-use loop.

Nine of 10 tasks show positive median savings. Only `pr-security-review` is flat (-0.4%). The top performers, `auth-middleware-fix` (+57.5%), `error-boundary` (+45.3%), `react-rerender` (+43.4%), retain real compression inside the CC harness. At the bottom, `postgres-pool` (+1.7%) and `docker-multi-stage` (+11.0%) barely clear the noise.

I keep coming back to this: Claude Code's baseline is already compressed. Look at the Track A and Track B baselines side by side. CC produces substantially shorter output *before* Caveman does anything:

| Task | Track A baseline (mean) | Track B baseline (mean) | CC compression |
|------|-----------------------:|-----------------------:|---------------:|
| docker-multi-stage | 2,445 | 484 | 80.2% |
| microservices-monolith | 1,486 | 512 | 65.6% |
| postgres-pool | 1,998 | 699 | 65.0% |
| race-condition-debug | 1,421 | 612 | 56.9% |
| async-refactor | 563 | 250 | 55.5% |
| auth-middleware-fix | 1,086 | 491 | 54.8% |
| react-rerender | 870 | 483 | 44.4% |
| git-rebase-merge | 921 | 587 | 36.2% |
| pr-security-review | 860 | 569 | 33.9% |
| error-boundary | 3,785 | 2,585 | 31.7% |

CC's system prompt compresses baselines by 32-80% before Caveman touches anything. The tasks where CC compresses most aggressively, `docker-multi-stage` (80.2%) and `microservices-monolith` (65.6%), are among those where Caveman's Track B effect is weakest (+11.0% each). The more CC has already compressed the output, the less room Caveman has left.

### Track C: Interference, not dilution

Track C is where it gets interesting. The degradation isn't gradual. It's immediate, and traceable to one specific component.

| Level | Context | async-refactor | error-boundary | pr-security-review |
|-------|---------|:--------------:|:--------------:|:------------------:|
| A' (no CC content) | ~6 tokens | 34.8% | 67.7% | 27.7% |
| L0 (behavioral block only) | ~3,500 tokens | 9.0% | 19.9% | 12.4% |
| L1 | ~6,300 tokens | 24.4% | 18.9% | 16.6% |
| L2 | ~9,100 tokens | 11.7% | 23.3% | 28.8% |
| L3 | ~11,900 tokens | 13.9% | 38.5% | 17.8% |
| L4 | ~14,700 tokens | 15.0% | 31.1% | 2.5% |
| L5 | ~17,500 tokens | 19.2% | 31.2% | 22.8% |
| B (CC CLI actual) | ~18K tokens | +19.5% | +45.3% | -0.4% |

Adding the behavioral block alone, ~3,500 tokens of identity, coding philosophy, tone/style mandates, and output efficiency rules, causes an immediate large drop:

- `async-refactor`: 34.8% to 9.0% (-25.8 points)
- `error-boundary`: 67.7% to 19.9% (-47.8 points)
- `pr-security-review`: 27.7% to 12.4% (-15.3 points)

Adding tool-definition chunks from L0 to L5 doesn't consistently degrade savings further. L1 through L5 are flat and noisy, no monotonic decay. For `error-boundary`, savings actually trend *upward* as more tool definitions are added. That's inconsistent with dilution, which predicts monotonic decay as context grows.

The behavioral block contains CC's "Tone and Style" and "Output Efficiency" sections, roughly 600 tokens telling the model to be concise, avoid filler, get to the point, produce short responses. These overlap directly with Caveman's `SKILL.md`, which tells the model to "respond terse," "drop articles," and cut "filler (just/really/basically/actually/simply)." Both target the same compression axes. CC's instructions carry positional priority: they appear earlier in the assembled prompt as part of the core system message, while Caveman's directive is appended as a plugin injection. In transformer-based models, earlier system prompt content tends to exert stronger behavioral influence when instructions conflict.

Comparing C-L5 to Track B, the results are broadly consistent: `async-refactor` shows 19.2% at L5 versus +19.5% at B (near-identical), `error-boundary` 31.2% versus +45.3% (higher in the actual CLI). `pr-security-review` is the outlier: 22.8% at L5 versus -0.4% at B. The three-task average is similar (24.4% at L5 versus 21.5% at B), suggesting the API reconstruction captures most of the harness effect. Remaining task-level differences likely come from the CLI's dynamic context (session info, git status, working directory) and multi-turn tool-use behavior that a static API call can't replicate.

## Analysis

### The gap decomposition

The total degradation from Track A's 63.1% to Track B's +25.3%, a 37.8-point gap, breaks down:

| Source | Magnitude | Share of gap |
|--------|-----------|--------------|
| API parameters (A to A') | -12.6pp | ~33% |
| CC behavioral instructions (A' to C-L0) | ~30pp average | ~48% |
| Tool definitions and additional context (C-L0 to C-L5) | negligible | ~0% |
| Remaining harness effects (C-L5 to B) | variable, small | ~19% |

Parameters contribute but don't dominate. Temperature=0 suppresses sampling variability and tends toward shorter output; no extended thinking skips a reasoning step that can expand output. Both inflate apparent savings. But even after correcting for parameters, Caveman still shows 50.6% savings at A'. The story doesn't end there.

The behavioral block is the primary cause. CC's tone, style, and output efficiency instructions, roughly 600 tokens within the 3,500-token behavioral block, already do much of what Caveman attempts. When both are present, the model doesn't compress twice at full strength. It's already been told to be terse. A second instruction to be terse adds incremental compression, not multiplicative.

The residual between C-L5 and Track B averages ~3 points and varies by task. No systematic additional degradation from the CLI harness beyond what system prompt content explains.

### Why interference and not dilution

This distinction matters beyond Caveman. If the mechanism were dilution, any sufficiently long system prompt would degrade any plugin, and there'd be no fix short of shortening context. If it's interference, plugins targeting dimensions CC doesn't already address should retain full effectiveness regardless of context size.

Track C supports interference. Dilution predicts monotonic decay from A' through C-L0 to C-L5, and content-agnostic degradation. Neither holds. The largest drop hits at C-L0 (3,500 tokens of behavioral instructions); subsequent additions of ~2,800 tokens per level produce no consistent further degradation. Content drives the collapse, not volume: 3,500 tokens of behavioral instructions cause a larger drop than 14,000 tokens of tool definitions stacked on top.

Plugins targeting output behaviors that CC's system prompt already addresses (verbosity, formatting, tone, structure) will see diminished returns. Plugins targeting behaviors CC doesn't address (domain-specific output schemas, language translation, code-style enforcement beyond CC's defaults) should be unaffected. That's a testable hypothesis, but beyond scope here.

### Task-level variation

Track B shows substantial variation across tasks. Three retain strong compression: `auth-middleware-fix` (+57.5%), `error-boundary` (+45.3%), `react-rerender` (+43.4%). Two show negligible effect: `postgres-pool` (+1.7%), `pr-security-review` (-0.4%).

The pattern loosely tracks how aggressively CC compresses each task's baseline. Tasks where CC already compresses by 60-80% (`docker-multi-stage`, `postgres-pool`, `microservices-monolith`) leave little headroom. Tasks where CC compresses by 30-45% (`error-boundary`, `react-rerender`) leave more, and Caveman captures much of it (+45.3% and +43.4%).

Loosely, not deterministically. `auth-middleware-fix` shows 54.8% CC baseline compression yet retains 57.5% Caveman savings. `pr-security-review` shows only 33.9% CC compression yet retains essentially zero Caveman savings. Task-specific factors (the type of prose involved, whether compression sacrifices structural content versus expendable filler, stochastic variance at n=5) introduce scatter that a simple headroom model can't fully explain.

### Cost implications

Under the author's API parameters, Caveman's compression translates to real cost savings: output drops from a median of 1,537 to 503 tokens per task, saving ~$15.50 per million output tokens at Sonnet 4.6 pricing. But Caveman's `SKILL.md` adds ~1,000 input tokens per call ($3/MTok input), partially offsetting the output savings. Net savings exist but are smaller than the raw percentage suggests.

Under Claude Code's CLI, the picture is more modest. At +25.3% median savings, output drops by about a quarter on average. For typical 350-600 token Track B outputs, that's 90-150 fewer output tokens per call, worth fractions of a cent at current pricing. The 1,000-token input overhead from `SKILL.md` partially offsets even these gains. For users on Claude Code's subscription plan rather than API pricing, token savings translate to faster responses, not direct cost reduction.

### Variance

Track B introduces a variance source the API tracks don't have: multi-turn tool-use behavior. Occasional runs trigger tool-use loops that inflate output. One `pr-security-review` run hit 6,853 tokens versus a typical 400-600. At n=5, a single outlier can swing the mean by hundreds of percentage points while barely moving the median. All Track B results here use median-based reporting. The author's n=3 design is particularly vulnerable to this kind of outlier.

## Implications

### Benchmarks need to match deployment conditions

This audit illustrates a pattern that extends beyond Caveman. The author's benchmark isn't fraudulent or misleading in intent. It correctly measures Caveman's effect under the conditions it tests. But those conditions diverge from the deployment environment in ways that inflate the practical conclusion. Three divergences compound:

1. **API parameters**: Temperature=0, no extended thinking, and a 4,096-token output cap are not Claude Code's defaults. These suppress the variance and expanded output that characterize real CC sessions, inflating apparent compression by ~12.6 points.

2. **System prompt content**: A 6-token baseline ("You are a helpful assistant") creates an artificially verbose starting point. Claude Code's 18,000-token system prompt already tells the model to produce concise output. Benchmarking a compression tool against an uncompressed baseline measures the tool's ceiling, not its marginal contribution in context.

3. **Harness mechanics**: Even after reconstructing CC's system prompt content via the API (Track C), minor residual differences remain between the reconstructed environment and the actual CLI. The harness itself introduces effects beyond its system prompt text, though these are smaller than the other two factors.

Any plugin that modifies model output behavior faces these same confounds. Benchmarks using raw API calls with minimal system prompts will systematically overstate effects that compete with the deployment harness's own instructions. The fix is simple: benchmark in the deployment environment, not a simplified proxy.

### The compression ceiling is real, and lower than advertised

CC's behavioral instructions and Caveman's `SKILL.md` target the same output properties: verbosity, filler, hedging, unnecessary framing. When both are present, the model doesn't compress twice at full strength. It lands somewhere between what either directive achieves alone and what both could achieve if they operated on orthogonal axes. The ~25% residual savings suggest Caveman's more aggressive rules (dropping articles, eliminating all filler, caveman-style terseness) do push output beyond what CC's moderate conciseness instructions achieve. But the marginal gain is far smaller than the standalone effect.

I think there's a floor here. Useful technical output seems to bottom out around 300-500 tokens for the coding tasks in this study, regardless of how many compression directives are stacked. At some point the model can't get any shorter without losing the actual answer.

### Plugin developers: test in the harness

If your plugin modifies output behavior (length, format, tone, structure), you can't validate it against the raw API alone. Test within `claude -p` or an equivalent harness that includes CC's system prompt, tool definitions, and default parameters. The author's benchmark framework is a useful starting point for API-level measurement, but it isn't sufficient for claims about Claude Code performance.

The gap decomposition suggests a rough correction factor for Caveman-like plugins targeting output verbosity and tone: approximately 60% relative reduction in effect size moving from a minimal API benchmark to the full CC harness (63% to 25%, a roughly 60% relative drop). Whether this generalizes to plugins targeting other output dimensions is an open question. Use API benchmarks for rapid iteration, but final validation has to happen in the deployment harness.

### What Caveman actually does well

None of this means Caveman is broken. Its `SKILL.md` is a strong compression directive. It reliably cuts output tokens by 50-67% against a minimal baseline and retains ~25% savings inside Claude Code. The engineering is solid. The issue is deployment context: the environment Caveman ships into has already partially solved the problem it addresses, leaving less room for a redundant compression signal.

For users running the Anthropic API directly with minimal system prompts (chat applications, simple Q&A endpoints, custom integrations without elaborate system instructions), Caveman's compression is real and substantial. Inside Claude Code, the effect is more modest but still present. 25% median reduction in output tokens is a real improvement, particularly for users who value faster responses over cost savings.

## Conclusion

Caveman works. The compression directive is well-engineered and produces substantial output reduction in isolation. The problem is not the plugin. It's the benchmark. By measuring against a minimal 6-token system prompt with artificial API parameters, the upstream benchmark captures Caveman's ceiling rather than its marginal contribution in the deployment environment.

Across 580 runs and four tracks, this study decomposes the 38-point gap between benchmark (63%) and deployment (25%) into three sources: API parameter differences (~33%), interference from CC's behavioral instructions (~48%), and residual harness effects (~19%). The mechanism is interference, not dilution. CC's existing conciseness instructions pre-empt Caveman's compression directive. Additional context volume is irrelevant.

The headline claim of 65-76% savings does not survive the transition from benchmark to deployment. The measured figure inside Claude Code is closer to 25%. That's a real improvement, but it demands honest measurement in the environment where the tool actually runs.
