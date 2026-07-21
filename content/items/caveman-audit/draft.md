---
item_id: portfolio/caveman-audit
---

# Caveman Audit: When Benchmarks Lie by Omission

## Introduction

The Caveman plugin for Claude Code promises dramatic output token savings. By injecting a system prompt that instructs Claude to "respond terse like smart caveman" -- dropping articles, filler words, pleasantries, and hedging while preserving technical substance -- it claims 15-87% reduction in output tokens across coding tasks. The upstream benchmark, published alongside the plugin, reports an average 76% savings across 10 representative tasks spanning debugging, implementation, refactoring, and code review.

These numbers are real. We reproduced them. But they were measured in conditions that do not match the environment Caveman was built for.

Caveman is a Claude Code plugin. It is installed through Claude Code, activated through Claude Code, and used inside Claude Code sessions. Yet the benchmark that validates it runs against the raw Anthropic API with a minimal six-token baseline system prompt, temperature set to zero, extended thinking disabled, and a 4,096-token output cap. None of these parameters match Claude Code's runtime defaults: temperature 1.0, extended thinking enabled, and a 16,384-token output ceiling. More critically, the benchmark's baseline system prompt -- "You are a helpful assistant" -- bears no resemblance to Claude Code's actual system prompt, which runs approximately 18,000 tokens of behavioral instructions, coding philosophy, tone guidance, and tool definitions.

This study asks a straightforward question: does Caveman's compression effect survive when tested in the environment where it actually runs? Across 580 experimental runs organized into four tracks, the answer is: partially. The 63% average savings observed under the author's methodology diminishes to +25.3% median savings under the Claude Code CLI -- real but roughly halved. The mechanism is interference: Claude Code's own behavioral instructions already compress output along the same axes Caveman targets, consuming much of the headroom a redundant compression directive depends on.

## Methodology

### Experimental design

We designed a four-track triangulation to isolate why Caveman's benchmark numbers do not fully transfer to real-world usage. Each track holds most variables constant while varying one dimension, enabling clean attribution of the effect's degradation.

| Track | Harness | System prompt | API parameters | Tasks | Runs per condition | Role |
|-------|---------|---------------|----------------|-------|--------------------|------|
| A | Anthropic API | Minimal (6 tokens) | Author's: temp=0, max=4,096, no thinking | 10 | 10 | Reproduce the author's benchmark |
| A' | Anthropic API | Minimal (6 tokens) | CC-matched: thinking ON (4K budget), max=16,384, temp=1.0 | 10 | 5 | Isolate parameter confounds |
| B | CC CLI (`claude -p`) | Full CC context (~18K tokens) | CC defaults (thinking ON, temp=1.0) | 10 | 5 | Measure real-world CC harness |
| C | Anthropic API | Incremental CC content (6 levels) | CC-matched | 3 | 5 orderings | Context-size sweep to identify collapse mechanism |

All tracks use the same model (`claude-sonnet-4-6`), the same 10 task prompts from the author's upstream benchmark (frozen at commit `84cc3c14fa1e`), and the same Caveman system prompt (`SKILL.md`). Each run is a fresh session with no context carryover.

### Track A: Reproducing the claim

Track A is a verbatim port of the author's `run.py` benchmark. We use the Anthropic SDK directly, set the baseline system prompt to "You are a helpful assistant," apply the author's API parameters (temperature=0, max_tokens=4096, no extended thinking), and run all 10 task prompts. The only deviation from the author's setup is the model version: we use `claude-sonnet-4-6` (current Sonnet) rather than the author's `claude-sonnet-4-20250514` (May 2025 snapshot, EOL June 2026), to match the model used across all other tracks.

We scaled from the author's n=3 to n=10 runs per condition per task, yielding 200 total runs. This provides more robust median estimates and exposes variance that n=3 conceals.

### Track A': Isolating parameter effects

Track A reproduces the author's result, but under API parameters that differ from Claude Code's defaults. The gap between Track A (63% savings) and Track B (+25% savings) conflates three potential confounds: system prompt content, tool schemas, and API parameters.

Track A' isolates the parameter contribution. It uses the same Anthropic API harness and the same minimal system prompt as Track A, but substitutes Claude Code's default parameters: temperature omitted (defaulting to 1.0), max_tokens=16,384, and extended thinking enabled with a 4,000-token budget. This yields 100 total runs (10 tasks, 2 conditions, 5 runs per cell).

### Track B: The real-world test

Track B replaces the API harness with the actual Claude Code CLI, invoked via `claude -p --output-format json` as a subprocess. The baseline condition uses Claude Code's full native context (~18,000 tokens of system prompt) with Caveman disabled via `enabledPlugins` configuration. The Caveman condition enables the plugin through the same mechanism.

To prevent contamination from the operator's personal configuration, all Track B runs execute against an isolated configuration directory (`~/.claude-clean`) containing no user-level `CLAUDE.md` or custom settings. This ensures the only difference between conditions is the presence or absence of Caveman's plugin injection. Caveman activation was verified by comparing input token counts between conditions: Caveman runs show approximately 1,000 more input tokens than baseline (17,088 versus 18,077), consistent with `SKILL.md` being prepended.

Track B comprises 100 total runs (10 tasks, 2 conditions, 5 runs per cell).

### Track C: The mechanism sweep

Tracks A through B establish that the effect diminishes, but not precisely why. Two competing hypotheses explain the degradation:

- **Dilution**: Caveman's approximately 1,000-token `SKILL.md` injection loses influence as total context grows from 6 tokens to 18,000 tokens, regardless of what that additional context contains. The compression signal is drowned in noise.

- **Interference**: Specific components of Claude Code's system prompt -- particularly its tone, style, and output efficiency instructions -- directly counteract Caveman's compression directive. The model receives conflicting or redundant instructions, and the higher-authority CC instructions prevail.

Track C discriminates between these hypotheses by decomposing Claude Code's system prompt into two structurally distinct components: a behavioral block (~3,500 tokens containing identity, coding philosophy, tone and style mandates, and output efficiency rules -- the content most likely to overlap with Caveman's compression directive) and 10 tool-definition chunks (~1,400 tokens each -- semantically inert with respect to output verbosity). We then progressively add content and measure Caveman's effect at six levels:

| Level | Content | Approximate system tokens |
|-------|---------|--------------------------|
| L0 | Behavioral block only | ~3,500 |
| L1 | Behavioral + 2 tool-definition chunks | ~6,300 |
| L2 | Behavioral + 4 tool-definition chunks | ~9,100 |
| L3 | Behavioral + 6 tool-definition chunks | ~11,900 |
| L4 | Behavioral + 8 tool-definition chunks | ~14,700 |
| L5 | Behavioral + all 10 tool-definition chunks | ~17,500 |

Track A' (no CC content, ~6 tokens) and Track B (full CC CLI, ~18K tokens) serve as the anchoring baselines. For each of three tasks selected to span the range of Track A savings -- `error-boundary` (72% savings, high), `async-refactor` (48.5%, medium), and `pr-security-review` (32.7%, low) -- we ran 5 random orderings of the tool-definition chunks at each level, producing 180 total API calls.

The shuffle design ensures that at each intermediate level, different tool-definition chunks are present across orderings, preventing confounds between chunk identity and cumulative token count.

### Metrics

The primary metric is output token savings: the percentage reduction in median output tokens between the baseline and Caveman conditions for each task. Secondary metrics include per-task variance (standard deviation of output tokens within condition) and cost (computed from token counts at published Sonnet 4.6 pricing: $3/MTok input, $15/MTok output). All medians are computed per condition per task; averages reported across tasks are averages of these per-task medians.

## Results

### Track A: The claim reproduces

Under the author's methodology, Caveman produces substantial and consistent output compression. All 10 tasks show savings in the expected direction.

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

Our average of 67.3% is 8.5 percentage points below the author's 75.8%, consistent with what we would expect from model version drift (we use Sonnet 4.6 versus the author's May 2025 snapshot) and our larger sample size (n=10 versus n=3, which reduces the influence of outlier runs). Direction matches on all 10 tasks: the claim reproduces.

Two tasks -- `async-refactor` and `microservices-monolith` -- show substantially higher savings than the author reported (+26 and +30 percentage points respectively). These are prose-heavy tasks where Sonnet 4.6 appears to produce more verbose baselines than the May 2025 snapshot, giving Caveman more material to compress. Three tasks -- `postgres-pool`, `race-condition-debug`, and `error-boundary` -- undershoot the author's numbers by 15-18 percentage points. The author's suspiciously low Caveman outputs for these tasks (159-456 tokens at n=3) suggest possible outlier effects in their smaller sample.

### Track A': Parameters explain ~20% of the gap

Switching from the author's API parameters to Claude Code's defaults while keeping the minimal system prompt reduces savings by an average of 12.6 percentage points.

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

*The `auth-middleware-fix` outlier (standard deviation of 713 in the Caveman condition) reflects a single anomalous run and should be interpreted with caution.

Caveman still works at 50.6% average savings under CC-matched parameters -- the effect is genuine, just inflated by temperature=0 and the absence of extended thinking. Parameters account for approximately one-third of the total gap between Track A and Track B. The remaining two-thirds must be attributed to the system prompt and harness.

### Track B: The effect diminishes in Claude Code

Under the actual Claude Code CLI, Caveman's compression effect persists but at roughly half its isolated effectiveness. The median savings across all 10 tasks averages +25.3%, down from 63.1% in Track A.

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

*Mean distorted by single outlier runs. At n=5, median is the reliable central tendency measure. The `auth-middleware-fix` mean reflects one Caveman run producing roughly 3x more tokens than typical. The `pr-security-review` mean reflects a single run hitting 6,853 tokens (versus a typical range of 400-600), likely triggered by a tool-use loop.

Nine of 10 tasks show positive median savings. Only `pr-security-review` is essentially flat (-0.4%). The top performers -- `auth-middleware-fix` (+57.5%), `error-boundary` (+45.3%), and `react-rerender` (+43.4%) -- retain substantial compression even within the CC harness. The bottom performers -- `postgres-pool` (+1.7%) and `docker-multi-stage` (+11.0%) -- show savings barely distinguishable from noise.

The critical observation is that Claude Code's baseline is already compressed. Comparing Track A and Track B baselines for the same tasks reveals that CC produces substantially shorter output before Caveman does anything:

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

CC's system prompt compresses baselines by 32-80% before Caveman does anything. The tasks where CC compresses the baseline most aggressively -- `docker-multi-stage` (80.2%) and `microservices-monolith` (65.6%) -- are among those where Caveman's Track B effect is weakest (+11.0% each). The general pattern holds: the more CC has already compressed the output, the less headroom remains for Caveman.

### Track C: Interference, not dilution

Track C reveals the mechanism. The degradation is not gradual -- it is immediate and attributable to a specific component of Claude Code's system prompt.

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

Adding the behavioral block alone -- approximately 3,500 tokens of identity, coding philosophy, tone and style mandates, and output efficiency rules -- causes an immediate large drop in Caveman's effectiveness:

- `async-refactor`: 34.8% to 9.0% (-25.8 percentage points)
- `error-boundary`: 67.7% to 19.9% (-47.8 percentage points)
- `pr-security-review`: 27.7% to 12.4% (-15.3 percentage points)

Adding tool-definition chunks from L0 to L5 does not consistently degrade savings further. The results across levels L1 through L5 are flat and noisy, with no monotonic decay pattern. For `error-boundary`, savings actually trend upward as more tool definitions are added. This pattern is inconsistent with the dilution hypothesis, which predicts monotonic decay as context volume increases.

The behavioral block contains Claude Code's "Tone and Style" and "Output Efficiency" sections -- approximately 600 tokens instructing the model to be concise, avoid filler, go straight to the point, and produce short responses. These instructions overlap directly with Caveman's `SKILL.md`, which instructs the model to "respond terse," "drop articles," and eliminate "filler (just/really/basically/actually/simply)." The interference is not incidental: both Caveman and CC's behavioral instructions target the same compression axes, and CC's instructions carry positional priority -- they appear earlier in the assembled prompt and form part of the core system message, while Caveman's directive is appended as a plugin injection. In transformer-based models, earlier system prompt content tends to exert stronger behavioral influence, particularly when instructions conflict.

Comparing Track C-L5 to Track B, the results are broadly consistent: `async-refactor` shows 19.2% at L5 versus +19.5% at B (near-identical), while `error-boundary` shows 31.2% at L5 versus +45.3% at B (higher in the actual CLI). `pr-security-review` is the outlier at 22.8% at L5 versus -0.4% at B. The average across three tasks is similar (24.4% at L5 versus 21.5% at B), suggesting that the API reconstruction captures most of the harness effect. Remaining task-level differences likely reflect variance from the CLI's dynamic context elements (session information, git status, working directory) and multi-turn tool-use behavior that a static API reconstruction cannot replicate.

## Analysis

The results establish the magnitude of the gap; this section examines its structure and mechanism.

### The gap decomposition

The total degradation from Track A's 63.1% average savings to Track B's +25.3% -- a 37.8-percentage-point gap -- decomposes as follows:

| Source | Magnitude | Share of gap |
|--------|-----------|--------------|
| API parameters (A to A') | -12.6pp | ~33% |
| CC behavioral instructions (A' to C-L0) | ~30pp average | ~48% |
| Tool definitions and additional context (C-L0 to C-L5) | negligible | ~0% |
| Remaining harness effects (C-L5 to B) | variable, small | ~19% |

Parameters are a contributing factor but not the dominant one. The author's use of temperature=0 (which suppresses sampling variability and tends to produce more deterministic, sometimes shorter output) and the absence of extended thinking (which adds a reasoning step that can expand output) inflate the apparent savings. But even after correcting for parameters, Caveman retains a 50.6% effect at A' -- the story does not end there.

The behavioral block is the primary identified cause. CC's tone, style, and output efficiency instructions -- roughly 600 tokens within the 3,500-token behavioral block -- already accomplish much of what Caveman attempts. When both are present, the model does not compress twice at full strength. It has already been told to be terse; a second instruction to be terse adds incremental compression, not multiplicative compression.

The residual between C-L5 and Track B is small on average (~3pp) and variable by task, suggesting no systematic additional degradation from the CLI harness beyond what the system prompt content explains.

### Interference, not dilution

The distinction matters for the broader plugin ecosystem, not just Caveman. If the mechanism were dilution -- Caveman's signal drowning in a larger context -- then any sufficiently long system prompt would degrade any plugin's effectiveness, and there would be no remedy short of shortening the context. If the mechanism is interference -- specific CC instructions pre-empting Caveman's directive -- then plugins targeting dimensions CC does not already address should retain full effectiveness regardless of context size.

The Track C data supports interference. Dilution predicts (1) monotonic decay from A' through C-L0 to C-L5, and (2) content-agnostic degradation. Neither holds. The largest drop occurs at C-L0 (3,500 tokens of behavioral instructions), and subsequent additions of ~2,800 tokens per level produce no consistent further degradation. Content, not volume, drives the collapse: 3,500 tokens of behavioral instructions cause a larger drop than 14,000 tokens of tool definitions stacked on top.

The practical implication: plugins targeting output behaviors that CC's system prompt already addresses -- verbosity, formatting, tone, structure -- will see diminished returns. Plugins targeting behaviors CC does not address (e.g., domain-specific output schemas, language translation, code-style enforcement beyond CC's defaults) should not be subject to this interference pattern. This hypothesis is testable but beyond the scope of this study.

### Task-level variation

The corrected Track B data reveals substantial task-level variation in Caveman's residual effectiveness. Three tasks retain strong compression in CC: `auth-middleware-fix` (+57.5%), `error-boundary` (+45.3%), and `react-rerender` (+43.4%). Two tasks show negligible effect: `postgres-pool` (+1.7%) and `pr-security-review` (-0.4%).

The pattern loosely correlates with how aggressively CC compresses each task's baseline. Tasks where CC already compresses the baseline by 60-80% (`docker-multi-stage`, `postgres-pool`, `microservices-monolith`) leave little headroom for Caveman. Tasks where CC compresses the baseline by 30-45% (`error-boundary`, `react-rerender`) leave more headroom -- and Caveman captures much of it (+45.3% and +43.4% respectively).

The correlation is loose, not deterministic. `auth-middleware-fix` shows 54.8% CC baseline compression yet retains 57.5% Caveman savings, while `pr-security-review` shows only 33.9% CC compression yet retains essentially zero Caveman savings. Task-specific factors -- the type of prose involved, whether compression sacrifices structural content versus expendable filler, and stochastic variance at n=5 -- introduce scatter that a simple headroom model cannot fully explain.

### Cost implications

Under the author's API parameters, Caveman's output compression translates to meaningful cost savings: reducing output from a median of 1,537 to 503 tokens per task saves approximately $15.50 per million output tokens at Sonnet 4.6 pricing. However, Caveman's `SKILL.md` adds approximately 1,000 input tokens per call ($3 per million input tokens), partially offsetting the output savings. Net cost savings exist but are smaller than the raw output percentage implies.

Under Claude Code's CLI, the cost picture is more modest. With +25.3% median savings -- reducing output by roughly a quarter on average -- the per-call savings are real but small in absolute terms. For the typical 350-600 token outputs in Track B, a 25% reduction saves 90-150 output tokens per call, worth fractions of a cent at current pricing. The 1,000-token input overhead from `SKILL.md` partially offsets even these modest savings. For users on Claude Code's subscription plan rather than API pricing, the token savings translate to faster responses rather than direct cost reduction.

### A note on variance

Track B introduces a variance source absent from the API tracks: multi-turn tool-use behavior. Occasional runs trigger tool-use loops that dramatically inflate output -- one `pr-security-review` run hit 6,853 tokens versus a typical 400-600. At n=5, a single outlier can swing the mean by hundreds of percentage points while barely moving the median. All Track B results in this study use median-based reporting; the author's n=3 design is particularly vulnerable to such outlier effects.

## Implications

### Benchmarks must match deployment conditions

The Caveman audit illustrates a pattern that extends beyond this specific plugin. The author's benchmark is not fraudulent or misleading in intent -- it correctly measures Caveman's effect under the conditions it tests. But those conditions diverge from the deployment environment in ways that significantly inflate the practical conclusion. Three specific divergences compound:

1. **API parameters**: Temperature=0, no extended thinking, and a 4,096-token output cap are not Claude Code's defaults. These parameters suppress the variance and expanded output that characterize real CC sessions, inflating apparent compression by approximately 12.6 percentage points.

2. **System prompt content**: A 6-token baseline ("You are a helpful assistant") creates an artificially verbose starting point. Claude Code's 18,000-token system prompt already instructs the model to produce concise, efficient output. Benchmarking a compression tool against an uncompressed baseline measures the tool's ceiling, not its marginal contribution in context.

3. **Harness mechanics**: Even after reconstructing CC's system prompt content via the API (Track C), minor residual differences remain between the reconstructed environment and the actual CLI. The harness itself introduces effects beyond its system prompt text, though these are smaller than the other two factors.

Any plugin or tool that modifies model output behavior is subject to these same confounds. Benchmarks that use raw API calls with minimal system prompts will systematically overstate effects that compete with the deployment harness's own instructions. The corrective is straightforward: benchmark in the deployment environment, not in a simplified proxy.

### The compression ceiling is not zero, but it is lower than advertised

Claude Code's behavioral instructions and Caveman's `SKILL.md` target the same output properties: verbosity, filler words, hedging, and unnecessary framing. When both are present, the model does not compress twice at full strength -- it reaches a level somewhere between what either directive achieves alone and what both could achieve if they operated on orthogonal axes. The roughly 25% residual savings suggest that Caveman's more aggressive compression rules (dropping articles, eliminating all filler, caveman-style terseness) do push output beyond what CC's relatively moderate conciseness instructions achieve, but the marginal gain is far smaller than the standalone effect.

The practical floor for useful technical output appears to sit somewhere around the 300-500 token range for the coding tasks in this study, regardless of how many compression directives are stacked.

### Plugin validation requires harness-level testing

For Claude Code plugin developers, the implication is direct: if your plugin modifies output behavior (length, format, tone, structure), you cannot validate it against the raw API alone. You must test within `claude -p` or an equivalent harness that includes CC's system prompt, tool definitions, and default parameters. The author's benchmark framework is a useful starting point for API-level measurement, but it is not sufficient for claims about Claude Code performance.

The gap decomposition from this study suggests a rough correction factor for Caveman-like plugins -- those targeting output verbosity and tone: approximately 60% relative reduction in effect size when moving from a minimal API benchmark to the full CC harness (63% to 25%, a roughly 60% relative drop). Whether this factor generalizes to plugins targeting other output dimensions remains an open question. Plugin developers can use API benchmarks for rapid iteration, but final validation must happen in the deployment harness.

### What Caveman does accomplish

This study does not conclude that Caveman is ineffective. It demonstrates that Caveman's `SKILL.md` is a strong compression directive -- it reliably reduces output tokens by 50-67% against a minimal baseline and retains roughly 25% savings inside Claude Code. The engineering is sound. The issue is one of deployment context: the environment Caveman ships into has already partially solved the problem it addresses, leaving less room for a redundant compression signal to operate.

For users running the Anthropic API directly with minimal system prompts -- chat applications, simple Q&A endpoints, custom integrations without elaborate system instructions -- Caveman's compression effect is real and substantial. Inside Claude Code, the effect is more modest but still present: a 25% median reduction in output tokens across tasks is a meaningful improvement, particularly for users who value faster response times over cost savings.

## Conclusion

Caveman works. The author's compression directive is well-engineered and produces substantial output reduction when operating in isolation. The problem is not the plugin -- it is the benchmark. By measuring against a minimal 6-token system prompt with artificial API parameters, the upstream benchmark captures Caveman's ceiling rather than its marginal contribution in the deployment environment.

Across 580 runs and four experimental tracks, this study decomposes the 38-percentage-point gap between benchmark (63%) and deployment (25%) into three sources: API parameter differences (~33%), interference from CC's behavioral instructions (~48%), and residual harness effects (~19%). The mechanism is interference, not dilution: CC's existing conciseness instructions pre-empt Caveman's compression directive, and additional context volume is irrelevant.

The headline claim of 65-76% savings does not survive the transition from benchmark to deployment. The measured figure inside Claude Code is closer to 25% -- a useful improvement, but one that demands honest measurement in the environment where the tool actually runs.
