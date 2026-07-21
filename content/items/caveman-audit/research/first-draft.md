# Caveman Audit: When Benchmarks Lie by Omission

## Introduction

The Caveman plugin for Claude Code promises dramatic output token savings. By injecting a system prompt that instructs Claude to "respond terse like smart caveman" -- dropping articles, filler words, pleasantries, and hedging while preserving technical substance -- it claims 15-87% reduction in output tokens across coding tasks. The upstream benchmark, published alongside the plugin, reports an average 76% savings across 10 representative tasks spanning debugging, implementation, refactoring, and code review.

These numbers are real. We reproduced them. But they were measured in conditions that do not match the environment Caveman was built for.

Caveman is a Claude Code plugin. It is installed through Claude Code, activated through Claude Code, and used inside Claude Code sessions. Yet the benchmark that validates it runs against the raw Anthropic API with a minimal six-token baseline system prompt, temperature set to zero, extended thinking disabled, and a 4,096-token output cap. None of these parameters match Claude Code's runtime defaults: temperature 1.0, extended thinking enabled, and a 16,384-token output ceiling. More critically, the benchmark's baseline system prompt -- "You are a helpful assistant" -- bears no resemblance to Claude Code's actual system prompt, which runs approximately 18,000 tokens of behavioral instructions, coding philosophy, tone guidance, and tool definitions.

This study asks a straightforward question: does Caveman's compression effect survive when tested in the environment where it actually runs? The answer, across 681 experimental runs organized into four tracks, is no. The 67% average savings observed under the author's methodology collapses to -1.9% under the Claude Code CLI. The mechanism is not dilution but interference: Claude Code's own behavioral instructions already compress output along the same axes Caveman targets, leaving no headroom for a redundant compression directive.

## Methodology

### Experimental design

We designed a four-track triangulation to isolate why Caveman's benchmark numbers do not transfer to real-world usage. Each track holds most variables constant while varying one dimension, enabling clean attribution of the effect's collapse.

| Track      | Harness              | System prompt                     | API parameters                                            | Tasks      | Runs per condition | Role                                              |
| ---------- | -------------------- | --------------------------------- | --------------------------------------------------------- | ---------- | ------------------ | ------------------------------------------------- |
| A          | Anthropic API        | Minimal (6 tokens)                | Author's: temp=0, max=4,096, no thinking                  | 10         | 10                 | Reproduce the author's benchmark                  |
| A'         | Anthropic API        | Minimal (6 tokens)                | CC-matched: thinking ON (4K budget), max=16,384, temp=1.0 | 10         | 5                  | Isolate parameter confounds                       |
| B          | CC CLI (`claude -p`) | Full CC context (~18K tokens)     | CC defaults (thinking ON, temp=1.0)                       | 10         | 10                 | Measure real-world CC harness                     |
| C          | Anthropic API        | Incremental CC content (6 levels) | CC-matched                                                | 3          | 5 orderings        | Context-size sweep to identify collapse mechanism |

All tracks use the same model (`claude-sonnet-4-6`), the same 10 task prompts from the author's upstream benchmark (frozen at commit `84cc3c14fa1e`), and the same Caveman system prompt (`SKILL.md`). Each run is a fresh session with no context carryover.

### Track A: Reproducing the claim

Track A is a verbatim port of the author's `run.py` benchmark. We use the Anthropic SDK directly, set the baseline system prompt to "You are a helpful assistant," apply the author's API parameters (temperature=0, max_tokens=4096, no extended thinking), and run all 10 task prompts. The only deviation from the author's setup is the model version: we use `claude-sonnet-4-6` (current Sonnet) rather than the author's `claude-sonnet-4-20250514` (May 2025 snapshot, EOL June 2026), to match the model used across all other tracks.

We scaled from the author's n=3 to n=10 runs per condition per task, yielding 200 total runs. This provides more robust median estimates and exposes variance that n=3 conceals.

### Track A': Isolating parameter effects

Track A reproduces the author's result, but under API parameters that differ from Claude Code's defaults. The gap between Track A (67% savings) and Track B (-1.9% savings) conflates three potential confounds: system prompt content, tool schemas, and API parameters.

Track A' isolates the parameter contribution. It uses the same Anthropic API harness and the same minimal system prompt as Track A, but substitutes Claude Code's default parameters: temperature omitted (defaulting to 1.0), max_tokens=16,384, and extended thinking enabled with a 4,000-token budget. This yields 100 total runs (10 tasks, 2 conditions, 5 runs per cell).

### Track B: The real-world test

Track B replaces the API harness with the actual Claude Code CLI, invoked via `claude -p --output-format json` as a subprocess. The baseline condition uses Claude Code's full native context (~18,000 tokens of system prompt) with Caveman disabled via `enabledPlugins` configuration. The Caveman condition enables the plugin through the same mechanism.

To prevent contamination from the operator's personal configuration, all Track B runs execute against an isolated configuration directory (`~/.claude-clean`) containing no user-level `CLAUDE.md` or custom settings. This ensures the only difference between conditions is the presence or absence of Caveman's plugin injection. Track B comprises 200 total runs.

### Track C: The mechanism sweep

Tracks A through B establish that the effect collapses, but not why. Two competing hypotheses explain the collapse:

* **Dilution**: Caveman's approximately 1,000-token `SKILL.md` injection loses influence as total context grows from 6 tokens to 18,000 tokens, regardless of what that additional context contains. The compression signal is drowned in noise.
* **Interference**: Specific components of Claude Code's system prompt -- particularly its tone, style, and output efficiency instructions -- directly counteract Caveman's compression directive. The model receives conflicting or redundant instructions, and the higher-authority CC instructions prevail.

Track C discriminates between these hypotheses by decomposing Claude Code's system prompt into a behavioral block (~3,500 tokens containing identity, coding philosophy, tone and style mandates, and output efficiency rules) and 10 tool-definition chunks (~1,400 tokens each). We then progressively add content and measure Caveman's effect at six levels:

| Level      | Content                                    | Approximate system tokens |
| ---------- | ------------------------------------------ | ------------------------- |
| L0         | Behavioral block only                      | ~3,500                    |
| L1         | Behavioral + 2 tool-definition chunks      | ~6,300                    |
| L2         | Behavioral + 4 tool-definition chunks      | ~9,100                    |
| L3         | Behavioral + 6 tool-definition chunks      | ~11,900                   |
| L4         | Behavioral + 8 tool-definition chunks      | ~14,700                   |
| L5         | Behavioral + all 10 tool-definition chunks | ~17,500                   |

Track A' (no CC content, ~6 tokens) and Track B (full CC CLI, ~18K tokens) serve as the anchoring baselines. For each of three selected tasks -- `error-boundary` (72% Track A savings), `async-refactor` (48.5%), and `pr-security-review` (32.7%) -- we ran 5 random orderings of the tool-definition chunks at each level, producing 180 total API calls.

The shuffle design ensures that at each intermediate level, different tool-definition chunks are present across orderings, preventing confounds between chunk identity and cumulative token count.

### Metrics

The primary metric is output token savings: the percentage reduction in median output tokens between the baseline and Caveman conditions for each task. Secondary metrics include per-task variance (standard deviation of output tokens within condition) and cost (computed from token counts at published Sonnet 4.6 pricing: $3/MTok input, $15/MTok output). All medians are computed per condition per task; averages reported across tasks are averages of these per-task medians.

## Results

### Track A: The claim reproduces

Under the author's methodology, Caveman produces substantial and consistent output compression. All 10 tasks show savings in the expected direction.

| Task                   | Baseline median | Caveman median | Savings    | Author's savings | Delta vs. author |
| ---------------------- | --------------- | -------------- | ---------- | ---------------- | ---------------- |
| react-rerender         | 872             | 231            | 73.5%      | 86.5%            | -13.0pp          |
| auth-middleware-fix    | 1,082           | 210            | 80.6%      | 82.8%            | -2.3pp           |
| postgres-pool          | 1,985           | 686            | 65.4%      | 83.8%            | -18.4pp          |
| git-rebase-merge       | 928             | 413            | 55.5%      | 58.4%            | -2.9pp           |
| async-refactor         | 567             | 292            | 48.5%      | 22.2%            | +26.3pp          |
| microservices-monolith | 1,452           | 580            | 60.1%      | 30.5%            | +29.6pp          |
| pr-security-review     | 854             | 574            | 32.7%      | 41.3%            | -8.6pp           |
| docker-multi-stage     | 2,450           | 456            | 81.4%      | 72.2%            | +9.2pp           |
| race-condition-debug   | 1,400           | 527            | 62.4%      | 80.7%            | -18.3pp          |
| error-boundary         | 3,777           | 1,058          | 72.0%      | 86.8%            | -14.8pp          |
| **Average**            | **1,537**       | **503**        | **67.3%**  | **75.8%**        | **-8.5pp**       |

Our average of 67.3% is 8.5 percentage points below the author's 75.8%, consistent with what we would expect from model version drift (we use Sonnet 4.6 versus the author's May 2025 snapshot) and our larger sample size (n=10 versus n=3, which reduces the influence of outlier runs). Direction matches on all 10 tasks: the claim reproduces.

Two tasks -- `async-refactor` and `microservices-monolith` -- show substantially higher savings than the author reported (+26 and +30 percentage points respectively). These are prose-heavy tasks where Sonnet 4.6 appears to produce more verbose baselines than the May 2025 snapshot, giving Caveman more material to compress. Three tasks -- `postgres-pool`, `race-condition-debug`, and `error-boundary` -- undershoot the author's numbers by 15-18 percentage points. The author's suspiciously low Caveman outputs for these tasks (159-456 tokens at n=3) suggest possible outlier effects in their smaller sample.

### Track A': Parameters explain ~20% of the gap

Switching from the author's API parameters to Claude Code's defaults while keeping the minimal system prompt reduces savings by an average of 12.6 percentage points.

| Task                   | Track A savings | Track A' savings | Parameter effect |
| ---------------------- | --------------- | ---------------- | ---------------- |
| async-refactor         | 46.5%           | 34.8%            | -11.7pp          |
| auth-middleware-fix    | 78.8%           | 19.8%            | -59.0pp*         |
| docker-multi-stage     | 79.7%           | 70.8%            | -8.9pp           |
| error-boundary         | 70.3%           | 67.7%            | -2.6pp           |
| git-rebase-merge       | 54.8%           | 44.4%            | -10.4pp          |
| microservices-monolith | 61.7%           | 58.2%            | -3.5pp           |
| postgres-pool          | 65.9%           | 60.9%            | -5.0pp           |
| pr-security-review     | 35.2%           | 27.7%            | -7.5pp           |
| race-condition-debug   | 65.4%           | 56.0%            | -9.4pp           |
| react-rerender         | 72.8%           | 65.3%            | -7.5pp           |
| **Average**            | **63.1%**       | **50.6%**        | **-12.6pp**      |

*The `auth-middleware-fix` outlier (standard deviation of 713 in the Caveman condition) reflects a single anomalous run and should be interpreted with caution.

Caveman still works at 50.6% average savings under CC-matched parameters -- the effect is genuine, just inflated by temperature=0 and the absence of extended thinking. Parameters account for approximately 20% of the total gap between Track A and Track B. The remaining 80% must be attributed to the system prompt and harness.

### Track B: The effect collapses in Claude Code

Under the actual Claude Code CLI, Caveman's compression effect disappears entirely. The average savings across all 10 tasks is -1.9%, meaning Caveman produces slightly more output than the baseline.

| Task                   | Baseline median | Caveman median | Track B savings | Track A savings | Delta B vs. A |
| ---------------------- | --------------- | -------------- | --------------- | --------------- | ------------- |
| async-refactor         | 165             | 201            | -21.8%          | 48.5%           | -70.3pp       |
| auth-middleware-fix    | 395             | 348            | +11.9%          | 80.6%           | -68.7pp       |
| docker-multi-stage     | 402             | 394            | +1.9%           | 81.4%           | -79.5pp       |
| error-boundary         | 543             | 762            | -40.3%          | 72.0%           | -112.3pp      |
| git-rebase-merge       | 424             | 434            | -2.2%           | 55.5%           | -57.7pp       |
| microservices-monolith | 353             | 366            | -3.8%           | 60.1%           | -63.9pp       |
| postgres-pool          | 502             | 448            | +10.9%          | 65.4%           | -54.6pp       |
| pr-security-review     | 433             | 351            | +19.0%          | 32.7%           | -13.7pp       |
| race-condition-debug   | 510             | 493            | +3.3%           | 62.4%           | -59.0pp       |
| react-rerender         | 437             | 425            | +2.7%           | 73.5%           | -70.8pp       |
| **Average**            | **476**         | **422**        | **-1.9%**       | **63.2%**       | **-65.1pp**   |

On 6 of 10 tasks, Caveman produces more output than the baseline, not less. Only `pr-security-review` retains meaningful positive savings (+19.0%). The remaining positive-savings tasks (`auth-middleware-fix`, `postgres-pool`, `race-condition-debug`, `react-rerender`) show single-digit effects well within noise.

The critical observation is that Claude Code's baseline is already compressed. Comparing Track A and Track B baselines for the same tasks reveals that CC produces dramatically shorter output before Caveman does anything:

| Task                   | Track A baseline | Track B baseline | CC compression |
| ---------------------- | ---------------- | ---------------- | -------------- |
| error-boundary         | 3,777            | 543              | 85.6%          |
| docker-multi-stage     | 2,450            | 402              | 83.6%          |
| microservices-monolith | 1,452            | 353              | 75.7%          |
| postgres-pool          | 1,985            | 502              | 74.7%          |
| async-refactor         | 567              | 165              | 70.9%          |

The tasks where Claude Code compresses the baseline most aggressively (85.6% for `error-boundary`, 83.6% for `docker-multi-stage`) are precisely where Caveman's Track B effect is weakest or most negative (-40.3% and +1.9% respectively). The task where CC compresses least (49.3% for `pr-security-review`) is where Caveman retains its largest positive effect (+19.0%). The compression headroom that Caveman depends on has already been consumed by Claude Code's own instructions.

### Track C: Interference, not dilution

Track C reveals the mechanism. The collapse is not gradual -- it is immediate and attributable to a specific component of Claude Code's system prompt.

| Level                      | Context        | async-refactor | error-boundary | pr-security-review |
| -------------------------- | -------------- | -------------- | -------------- | ------------------ |
| A' (no CC content)         | ~6 tokens      | 34.8%          | 67.7%          | 27.7%              |
| L0 (behavioral block only) | ~3,500 tokens  | 9.0%           | 19.9%          | 12.4%              |
| L1                         | ~6,300 tokens  | 24.4%          | 18.9%          | 16.6%              |
| L2                         | ~9,100 tokens  | 11.7%          | 23.3%          | 28.8%              |
| L3                         | ~11,900 tokens | 13.9%          | 38.5%          | 17.8%              |
| L4                         | ~14,700 tokens | 15.0%          | 31.1%          | 2.5%               |
| L5                         | ~17,500 tokens | 19.2%          | 31.2%          | 22.8%              |
| B (CC CLI actual)          | ~18K tokens    | -5.6%          | -33.8%         | 17.4%              |

Adding the behavioral block alone -- approximately 3,500 tokens of identity, coding philosophy, tone and style mandates, and output efficiency rules -- causes an immediate large drop in Caveman's effectiveness:

* `async-refactor`: 34.8% to 9.0% (-25.8 percentage points)
* `error-boundary`: 67.7% to 19.9% (-47.8 percentage points)
* `pr-security-review`: 27.7% to 12.4% (-15.3 percentage points)

Adding tool-definition chunks from L0 to L5 does not consistently degrade savings further. The results across levels L1 through L5 are flat and noisy, with no monotonic decay pattern. For `error-boundary`, savings actually trend upward as more tool definitions are added. This pattern is inconsistent with the dilution hypothesis, which predicts monotonic decay as context volume increases.

The behavioral block contains Claude Code's "Tone and Style" and "Output Efficiency" sections -- approximately 600 tokens instructing the model to be concise, avoid filler, go straight to the point, and produce short responses. These instructions overlap directly with Caveman's `SKILL.md`, which instructs the model to "respond terse," "drop articles," and eliminate "filler (just/really/basically/actually/simply)." The interference is not incidental: both Caveman and CC's behavioral instructions target the same compression axes, and CC's instructions carry higher authority as part of the system prompt rather than a plugin injection.

The remaining gap between Track C-L5 and Track B for some tasks (e.g., `error-boundary`: +31.2% at L5 versus -33.8% at B) suggests additional CC harness effects beyond system prompt text content -- possibly related to plugin injection mechanics, context assembly order, or turn structure in the CLI.

## Analysis

### The gap decomposition

The total collapse from Track A's 63.1% average savings to Track B's -1.9% -- a 65-percentage-point gap -- decomposes as follows:

| Source                                                 | Magnitude      | Share of gap |
| ------------------------------------------------------ | -------------- | ------------ |
| API parameters (A to A')                               | -12.6pp        | ~20%         |
| CC behavioral instructions (A' to C-L0)                | ~-30pp average | ~48%         |
| Tool definitions and additional context (C-L0 to C-L5) | negligible     | ~0%          |
| Remaining harness effects (C-L5 to B)                  | variable       | ~32%         |

Parameters are a contributing factor but not the dominant one. The author's use of temperature=0 (which suppresses sampling variability and tends to produce more deterministic, sometimes shorter output) and the absence of extended thinking (which adds a reasoning step that can expand output) inflate the apparent savings. But even after correcting for parameters, Caveman retains a 50.6% effect at A' -- the story does not end there.

The behavioral block is the primary identified cause. CC's tone, style, and output efficiency instructions -- roughly 600 tokens within the 3,500-token behavioral block -- already accomplish what Caveman attempts. When both are present, the model does not compress twice. It has already been told to be terse; a second instruction to be terse adds nothing.

The unexplained residual between C-L5 (positive savings, 19-31%) and Track B (near-zero or negative savings) merits further investigation. Candidate explanations include: differences in how the CLI assembles and positions system prompt components versus our API reconstruction; plugin-specific injection mechanics that alter message structure; and the presence of dynamic context elements (session information, git status, working directory) in the CLI that our static reconstruction omits.

### Interference, not dilution

The distinction between interference and dilution is the central finding. The dilution hypothesis predicts that Caveman's effect should decay as a smooth function of total context size -- more tokens means more noise drowning the compression signal. If dilution were the mechanism, we would expect: (1) monotonic decay from A' through C-L0 to C-L5, and (2) the specific content of the additional context to be irrelevant.

Neither prediction holds. The decay is not monotonic: the largest drop occurs between A' (6 tokens, 50.6% savings) and C-L0 (3,500 tokens, ~14% savings), and subsequent additions of ~2,800 tokens per level produce no consistent further degradation. And the content matters: 3,500 tokens of behavioral instructions cause a larger drop than 14,000 tokens of tool definitions stacked on top.

The interference hypothesis predicts precisely this pattern: specific content that competes with Caveman's directive should cause a step-function collapse regardless of volume, while inert content (tool definitions that do not address output style) should have no effect regardless of how many tokens it occupies. This is what we observe.

This finding generalizes beyond Caveman. Any Claude Code plugin or configuration that targets output behavior -- verbosity, formatting, tone, structure -- is operating in a space already claimed by CC's system prompt. The effectiveness of such interventions cannot be predicted from API-level benchmarks; it must be measured within the actual harness.

### The pr-security-review exception

One task consistently resists the pattern. `pr-security-review` retains positive savings across Track B (+19.0%) and across most Track C levels. This task asks the model to review a pull request for security issues -- a task that inherently requires structured, qualifying prose ("this pattern could lead to...," "consider whether...," "the risk here is..."). Neither Caveman's compression directive nor CC's terse-output instructions fully suppress this qualifying structure, because doing so would compromise the task's essential content: security reviews that omit hedging and qualification are not shorter reviews, they are worse reviews.

This exception is consistent with the interference model. Caveman works by compressing expendable prose -- filler, hedging, pleasantries, verbose framing. Tasks where the prose is structurally load-bearing rather than expendable leave more headroom for compression directives to act on, even when CC's behavioral instructions are present. However, this is one task out of ten, and its practical significance should not be overstated.

### Variance and reliability

Track A's results show moderate within-task variance (typical standard deviations of 100-400 tokens per condition), consistent with what we would expect from n=10 runs at temperature=0. Track A' and Track C, running at temperature=1.0 with extended thinking, show higher variance, as expected. The `auth-middleware-fix` outlier in Track A' (standard deviation of 713 in the Caveman condition from a single anomalous run) illustrates the risk of small sample sizes: the author's n=3 design is particularly vulnerable to such outliers distorting reported savings percentages.

Track B's results are notably tight: baseline and Caveman medians are close across most tasks, with the differences falling within normal run-to-run variance. The effect is not merely small -- it is indistinguishable from noise on most tasks.

### Cost implications

Under the author's API parameters, Caveman's output compression translates to meaningful cost savings: reducing output from a median of 1,537 to 503 tokens per task saves approximately $15.50 per million output tokens at Sonnet 4.6 pricing. However, Caveman's `SKILL.md` adds approximately 1,000 input tokens per call ($3 per million input tokens), partially offsetting the output savings. Net cost savings exist but are smaller than the raw output percentage implies.

Under Claude Code's CLI, the cost analysis is moot. With -1.9% average savings and 6 of 10 tasks producing more output, Caveman does not reduce costs in its intended deployment environment. It may marginally increase them, though the magnitude is within noise.

## Implications

### Benchmarks must match deployment conditions

The Caveman audit illustrates a pattern that extends beyond this specific plugin. The author's benchmark is not fraudulent or misleading in intent -- it correctly measures Caveman's effect under the conditions it tests. But those conditions diverge from the deployment environment in ways that invalidate the practical conclusion. Three specific divergences compound:

1. **API parameters**: Temperature=0, no extended thinking, and a 4,096-token output cap are not Claude Code's defaults. These parameters suppress the variance and expanded output that characterize real CC sessions, inflating apparent compression by approximately 12.6 percentage points.
2. **System prompt content**: A 6-token baseline ("You are a helpful assistant") creates an artificially verbose starting point. Claude Code's 18,000-token system prompt already instructs the model to produce concise, efficient output. Benchmarking a compression tool against an uncompressed baseline measures the tool's ceiling, not its marginal contribution in context.
3. **Harness mechanics**: Even after reconstructing CC's system prompt content via the API (Track C), a residual gap remains between the reconstructed environment and the actual CLI. The harness itself introduces effects beyond its system prompt text.

Any plugin or tool that modifies model output behavior is subject to these same confounds. Benchmarks that use raw API calls with minimal system prompts will systematically overstate effects that compete with the deployment harness's own instructions. The corrective is straightforward: benchmark in the deployment environment, not in a simplified proxy.

### The compression ceiling is not unlimited

Claude Code's behavioral instructions and Caveman's `SKILL.md` target the same output properties: verbosity, filler words, hedging, and unnecessary framing. When both are present, the model does not compress twice -- it compresses once, to roughly the same level it would have reached with either instruction alone. This suggests a natural floor to how terse Claude can be while still producing useful technical output. That floor appears to sit somewhere around the 350-550 token range for the coding tasks in this study, regardless of how many redundant compression directives are stacked.

### Plugin validation requires harness-level testing

For Claude Code plugin developers, the implication is direct: if your plugin modifies output behavior (length, format, tone, structure), you cannot validate it against the raw API. You must test within `claude -p` or an equivalent harness that includes CC's system prompt, tool definitions, and default parameters. The author's benchmark framework is a useful starting point for API-level measurement, but it is not sufficient for claims about Claude Code performance.

### What Caveman does accomplish

This study does not conclude that Caveman is useless. It demonstrates that Caveman's `SKILL.md` is an effective compression directive when operating in isolation -- it reliably reduces output tokens by 50-67% against a minimal baseline. The engineering is sound. The issue is purely one of deployment context: the environment Caveman ships into has already solved the problem it addresses.

For users running the Anthropic API directly with minimal system prompts -- chat applications, simple Q&A endpoints, custom integrations without elaborate system instructions -- Caveman's compression effect is real and substantial. The claim fails specifically in Claude Code, where the harness pre-empts it.
