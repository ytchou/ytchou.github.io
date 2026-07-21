# Context Padding Strategy for Track C

## The Problem

Track C needs to measure Caveman's compression effectiveness across context sizes (~100 to ~120K tokens). We need to "pad" prompts to hit target token counts. But how we pad matters — filler content can change model behavior independent of context length.

This doc surveys how the research field handles this, then recommends an approach for our experiment.

---

## How Researchers Pad Context: A Survey

### 1. Paul Graham Essay Haystack (NIAH)

**Source:** [Needle In A Haystack](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) — Greg Kamradt (2023)

**Method:** Concatenate Paul Graham blog essays as filler. Insert a target fact ("needle") at varying depths and context lengths. Measure retrieval accuracy.

**Filler type:** Real-world essays. Coherent, English prose, single author, single domain (startup advice).

**Pros:**
- Simple to implement — essays are public domain, easy to tokenize and slice
- Established benchmark — dozens of papers reuse this exact corpus, making results comparable
- Coherent text — won't trigger model confusion or refusal

**Cons:**
- **Homogeneous domain** — all startup/tech essays. Models may learn to "tune out" this specific style
- **Compressible** — repetitive themes across essays. KV-cache-aware models may compress this more efficiently than diverse text, making the effective context smaller than the nominal token count
- **Single author voice** — doesn't represent the diversity of real context windows

**When to use:** When you want comparability with existing NIAH benchmarks. Not ideal when testing output behavior (vs. retrieval accuracy).

---

### 2. PG19 / BookCorpus (Long-form Narrative)

**Source:** [BABILong](https://arxiv.org/abs/2406.10149) — Kuratov et al. (2024)

**Method:** Embed bAbI reasoning tasks inside PG19 (Project Gutenberg books published pre-1919). Test up to 1M tokens.

**Filler type:** Public-domain fiction. Diverse authors, genres, time periods.

**Pros:**
- More diverse than single-author essays
- Long-form, high-quality prose — won't trigger model safety filters
- Very large corpus available — easy to scale to 100K+ tokens

**Cons:**
- Archaic language (pre-1919) — distribution mismatch with modern technical prompts
- Fiction ≠ technical context — model may compartmentalize differently
- Still all narrative prose — no structural diversity (no code, no JSON, no lists)

**When to use:** When you need large-scale padding with more diversity than Paul Graham essays, and domain mismatch is acceptable.

---

### 3. Multi-Domain Document Mix

**Source:** [Lost in the Middle](https://arxiv.org/abs/2307.03172) — Liu et al. (2023, Stanford/UC Berkeley)

**Method:** Multi-document QA. Place 10–30 Wikipedia documents as context, one contains the answer. Vary position of the gold document.

**Filler type:** Wikipedia articles from Natural Questions dataset. Diverse topics, factual, encyclopedic.

**Key finding:** Models perform best when relevant info is at the beginning or end. **30%+ accuracy drop for middle-positioned content.** This "lost in the middle" effect means padding position matters, not just padding volume.

**Pros:**
- Naturally diverse topics
- Factual, neutral tone — similar register to technical documentation
- Well-established finding about position effects

**Cons:**
- Wikipedia has distinctive formatting (section headers, citation markers) — models may recognize it as filler
- Sourcing and licensing considerations for reproduction
- Individual articles are short — need many to reach high token counts

**When to use:** When testing how position within context affects output. Critical reference for our experiment design (should we pad before or after the prompt?).

---

### 4. Synthetic / Structured Filler

**Source:** [RULER](https://arxiv.org/abs/2404.06654) — Hsieh et al. (2024, NVIDIA)

**Method:** Extends NIAH with synthetic tasks: multi-key lookup, multi-hop tracing, aggregation. Uses generated key-value pairs and synthetic documents as distractor context.

**Key finding:** Models claiming 128K context maintain satisfactory performance only up to 32K. Tested 17 models.

**Filler type:** Synthetic key-value pairs, procedurally generated text.

**Pros:**
- Full control over filler properties — density, structure, information content
- Reproducible — no external corpus dependency
- Can control compressibility by design

**Cons:**
- Unnatural — model may treat synthetic text differently than real text
- Risk of "gaming" — synthetic patterns may be easier/harder to ignore than real text
- Requires careful design to avoid artifacts

**When to use:** When you need precise control over filler properties and reproducibility matters more than ecological validity.

---

### 5. Task-Relevant Distractor Content

**Source:** [GSM-DC: How Is LLM Reasoning Distracted by Irrelevant Context?](https://arxiv.org/abs/2505.18761) — (2025)

**Method:** Inject irrelevant but plausible information into math word problems. Measure reasoning degradation.

**Key finding:** **Filler type changes results.** Models trained with strong distractors improve robustness. Relevant-seeming distractors hurt more than obviously irrelevant ones.

**Filler type:** Domain-matched but task-irrelevant sentences (e.g., extra numerical facts in math problems).

**Pros:**
- Tests realistic "noise" — real context windows contain related-but-irrelevant info
- Measures distraction effect, not just retrieval
- Most ecologically valid for our use case

**Cons:**
- Hardest to construct — requires domain expertise to create plausible distractors
- Results may not generalize across domains
- Labor-intensive at scale

**When to use:** When you care about whether filler *distracts* the model from the task, not just whether the model can *find* things in context.

---

### 6. Prior Conversation History (Natural Context Accumulation)

**Source:** No single paper — used across multiple evaluation frameworks.

**Method:** Build up context through multi-turn conversation. Earlier turns serve as natural padding for later turns.

**Filler type:** The model's own prior outputs + prior user messages.

**Pros:**
- Most ecologically valid — this is how real context windows fill up
- Context has natural structure (turn markers, tool calls, results)
- Model is already "trained" to handle this format

**Cons:**
- High variance — each conversation takes a different path
- Expensive — need to actually run multi-turn conversations
- Hard to control exact token count — conversations don't pad to precise targets
- Confounding: earlier turns may influence later outputs beyond just context length

**When to use:** When ecological validity matters more than experimental control. Better suited for qualitative studies than controlled token-count experiments.

---

## Comparison Matrix

| Strategy | Diversity | Ecological Validity | Compressibility Risk | Implementation Cost | Token Precision | Reproducibility |
|---|---|---|---|---|---|---|
| Paul Graham essays | Low | Low | **High** | Very low | High | High |
| PG19 books | Medium | Low | Medium | Low | High | High |
| Multi-domain Wikipedia | High | Medium | Low | Medium | High | High |
| Synthetic structured | Controllable | Low | Controllable | Medium | High | Very high |
| Task-relevant distractors | High | **High** | Low | **High** | Medium | Medium |
| Conversation history | High | **Very high** | Low | **Very high** | **Low** | **Low** |

---

## Key Findings from Literature

### 1. Filler type changes results — this is established

GSM-DC (2025) and Lost in the Middle (2023) both demonstrate that what you pad with affects model behavior. Homogeneous, compressible filler underestimates context-length effects. This is not a theoretical concern — it's measured.

### 2. Position within context matters

Lost in the Middle shows 30%+ accuracy degradation for middle-positioned content. For our experiment: padding placement (before prompt, after prompt, surrounding prompt) is a design choice, not a neutral default.

### 3. Models perform worse than claimed at long contexts

BABILong (2024) and RULER (2024) both show that effective context length is much shorter than advertised. Models claiming 128K+ capacity often degrade by 32K. Our Track C range (100–120K) spans this degradation zone.

### 4. KV-cache compression interacts with content type

[KV Cache Compression Survey](https://arxiv.org/abs/2407.01527) (2024) and [KVzip](https://arxiv.org/abs/2505.23416) (2025) show that attention-based compression preserves task-relevant information while discarding filler. Homogeneous filler gets compressed more aggressively — meaning the model's "effective context" may be much shorter than the nominal token count for easy-to-compress padding.

---

## Recommendation for Caveman Audit Track C

### Our specific needs

1. **We're measuring output compression, not retrieval accuracy.** Most NIAH-family research measures whether the model can *find* information. We measure whether the model produces *shorter output*. Different task → different sensitivity to filler type.

2. **We need the filler to actually occupy the model's attention budget.** If KV-cache compression trivially discards our filler, we're not actually testing "Caveman at 50K context" — we're testing "Caveman at 50K nominal but 5K effective." Filler must be incompressible enough to genuinely occupy context.

3. **We need to distinguish between two hypotheses:**
   - **Dilution hypothesis:** Caveman's ~1K-token system prompt injection loses influence as total context grows, regardless of what that context contains. Pure signal-to-noise ratio.
   - **Interference hypothesis:** Specific components of CC's system prompt (e.g., tone/conciseness instructions) directly counteract Caveman's compression signal. Content matters, not just volume.

4. **We need reproducibility.** Must be deterministic and consistent across runs.

5. **We need the 18K overlap point to be meaningful.** At ~18K total system tokens, our API-direct experiment should approximate what CC actually sends — making comparisons with Track B valid.

### Why we focus on Leg 1 only (API direct)

Our experiment uses the Anthropic API directly. We're sending a single question with no prior conversation, no caching concerns, and no turn structure. The CC CLI is not involved — we're reconstructing CC's system prompt content and injecting it ourselves via the `system` message.

This gives us full control: we choose exactly which CC components are present, in what order, at what cumulative token count. No CLI-specific confounds.

Leg 2 (CLI, 18K → 120K) is deferred. Track B already established the effect at ~18K in the real CLI. Extending beyond 18K is a secondary question — we first need to understand the mechanism of collapse *up to* 18K.

### Padding source: Reverse-engineered CC system prompt

**What:** Use publicly available extractions of Claude Code's system prompt as the filler corpus.

**Primary source:** [Piebald-AI/claude-code-system-prompts](https://github.com/Piebald-AI/claude-code-system-prompts) — canonical extraction from CC's compiled JS source, 110+ files with per-section token counts, updated per release. We freeze one version, hash it, document provenance in `data/PROVENANCE.md`.

**Additional references:**
- [How Claude Code Builds a System Prompt](https://www.dbreunig.com/2026/04/04/how-claude-code-builds-a-system-prompt.html) — Breunig (2026), documents assembly order and component categories
- [Inside Claude Code's Prompt Architecture](https://kotrotsos.medium.com/inside-claude-codes-prompt-architecture-ca0803162d82) — 15+ sections, 28 prompt files

**Why CC system prompt content (not generic docs):**

| Alternative | Problem |
|---|---|
| Generic technical docs | Can't distinguish dilution from interference. If effect dies at 10K of Python docs, is it volume or content? |
| Paul Graham essays | Same problem, plus homogeneous and compressible. |
| PG19 fiction | Domain mismatch. Victorian novels → React question is absurd. |
| Synthetic text | No ecological validity. Model may treat it as noise. |
| CC system prompt | **Directly tests what killed the effect in Track B.** At 18K, we approximate Track B's actual setup, making the overlap point meaningful. |

### The 10-slice shuffle design

#### CC system prompt decomposition

Based on the Piebald-AI extraction and Breunig's analysis, CC's system prompt breaks into ~10 semantic components:

| Slice | Content | ~Tokens | Caveman overlap? |
|---|---|---|---|
| 1 | **Identity / role** — "You are Claude, made by Anthropic..." | ~100 | Low |
| 2 | **System rules** — ground rules for tools and permissions | ~300 | Low |
| 3 | **Doing Tasks** — coding philosophy ("don't over-engineer", "no unnecessary abstractions") | ~600 | Medium |
| 4 | **Executing Actions with Care** — reversibility, blast-radius assessment | ~540 | Low |
| 5 | **Using Your Tools** — prefer native tools over shell | ~550 | Low |
| 6 | **Tone and Style** — conciseness mandates, no emojis, short responses | ~300 | **High — prime suspect** |
| 7 | **Output Efficiency** — "Go straight to the point", "Be extra concise" | ~300 | **High — prime suspect** |
| 8 | **Session / Memory / Environment** — auto-memory, cwd, platform, git status | ~800 | Low |
| 9 | **Tool definitions (part 1)** — Read, Write, Edit, Bash, Grep, Glob | ~7,000 | Low |
| 10 | **Tool definitions (part 2)** — Agent, Monitor, skills, MCP, remaining tools | ~7,000 | Low |
| | **Total** | **~17,500** | |

Note: Slices 6 and 7 ("Tone and Style" + "Output Efficiency") total only ~600 tokens but are the most likely to interfere with Caveman. Caveman's SKILL.md tells the model to "respond terse" and drop articles/filler — these CC sections already push toward conciseness. If the interference hypothesis is correct, these slices should show the strongest effect regardless of when they appear in the ordering.

#### The shuffle mechanism

Instead of adding slices in CC's natural order (which confounds "which component" with "how many tokens"), we **randomly shuffle the 10 slices for each run**.

**How it works:**
1. Decompose CC's system prompt into 10 semantic slices (table above)
2. For each run, generate a random permutation of slices 1–10
3. Measure Caveman's output token savings at each cumulative level:
   - After 1 slice (~100–7,000 tokens, depending on which slice is first)
   - After 2 slices
   - ...
   - After all 10 slices (~17,500 tokens total)
4. Each run produces 10 data points on the degradation curve
5. Across 30 runs (30 random orderings), we get 30 degradation curves

**What this reveals:**

Because each ordering adds slices in a different sequence, we can regress:

```
caveman_savings ~ total_tokens + slice_1_present + slice_2_present + ... + slice_10_present
```

- If `total_tokens` dominates and no individual slice coefficient is significant → **dilution hypothesis confirmed.** Volume kills Caveman, content doesn't matter.
- If specific slice coefficients are significant (e.g., slice 6 "Tone and Style" has a large negative coefficient) → **interference hypothesis confirmed.** That specific component counteracts Caveman.
- Mixed result → both mechanisms contribute, and we can quantify the relative contribution.

**Example scenario:**

Run A ordering: `[9, 3, 1, 6, 10, 4, 8, 2, 5, 7]`
Run B ordering: `[2, 7, 5, 1, 4, 9, 3, 10, 8, 6]`

In Run A, slice 6 ("Tone and Style") is added 4th (~1,540 cumulative tokens).
In Run B, slice 6 is added last (~17,500 cumulative tokens).

If Caveman degrades sharply at step 4 in Run A but not until step 10 in Run B, and both times it correlates with slice 6's inclusion — that's a signal. Across 30 orderings, this becomes statistically testable.

### Experimental design

#### Task selection (5 of 10)

Choose tasks spanning Track A's compression range and covering different categories:

| Task | Track A savings | Category | Why included |
|---|---|---|---|
| `error-boundary` | 72.0% | Code generation | High saver — lots of headroom for degradation |
| `docker-multi-stage` | 81.4% | DevOps | Highest saver — ceiling effect reference |
| `async-refactor` | 48.5% | Refactoring | Mid-range — tests whether category matters |
| `pr-security-review` | 32.7% | Code review | Lowest saver — retained effect in Track B (+19%) |
| `git-rebase-merge` | 55.5% | Explanation | Pure prose task — no code in output |

This selection covers: code-heavy (error-boundary, docker), prose-heavy (git-rebase, pr-review), and hybrid (async-refactor). It also includes the Track B outlier (pr-security-review) to test whether its resilience persists.

#### Run budget

| Parameter | Value |
|---|---|
| Tasks | 5 |
| Orderings per task | 30 (random permutations) |
| Levels per ordering | 10 (cumulative slices) |
| Conditions | 2 (baseline + caveman) |
| **API calls per task** | **30 × 10 × 2 = 600** |
| **Total API calls** | **5 × 600 = 3,000** |
| **Data points** | **3,000** (each call = one measurement) |

Note: We already have Track A (n=10 per task, ~6 tok system) and Track B (n=10 per task, ~18K CC system) as anchoring baselines. These 20 existing data points per task bracket the curve. Track C fills in the 10 levels between them, with 30 orderings providing statistical power to separate volume from content effects.

#### Cost estimate

Average input tokens per call: slices range from ~100 to ~17,500 tokens cumulative. Mean across 10 levels ≈ ~9,000 tokens. Plus ~100 tokens for the task prompt. Plus ~1,000 tokens for Caveman's SKILL.md in the caveman condition.

| | Tokens | Rate | Cost |
|---|---|---|---|
| Input | 3,000 calls × ~10K avg | $3/MTok | ~$90 |
| Output | 3,000 calls × ~800 avg (mix of baseline ~1,200 and caveman ~400) | $15/MTok | ~$36 |
| **Total** | | | **~$126** |

Prompt caching could reduce this significantly — the system prompt content is the same across runs within a task (just reordered), and Anthropic caches at 5-minute TTL. If we batch same-ordering runs together, cache hit rate should be high, reducing input cost by ~90% on cache-read tokens ($0.30/MTok vs $3/MTok).

**Conservative estimate: ~$126. With caching: ~$50–70.**

**Budget-conscious option (3 tasks):** If $126 feels high, start with 3 tasks (error-boundary, pr-security-review, async-refactor) for ~$75 and add 2 more if results are promising. These 3 span the full savings range and include the Track B outlier.

#### Placement

All CC slice content goes in the `system` message. Task prompt in the `user` message. This matches CC's actual architecture and keeps the task in the recency position.

```python
import random

# Each run: shuffle slices, measure at each cumulative level
for run_num in range(30):
    ordering = list(range(10))
    random.shuffle(ordering)  # seeded for reproducibility
    
    system_content = ""
    for level, slice_idx in enumerate(ordering):
        system_content += slices[slice_idx]
        
        for condition in ["baseline", "caveman"]:
            system = system_content
            if condition == "caveman":
                system = SKILL_MD + "\n\n" + system_content
            
            response = client.messages.create(
                model="claude-sonnet-4-6",
                system=system,
                messages=[{"role": "user", "content": task_prompt}],
                max_tokens=4096,
                temperature=0,
            )
            # Record: run_num, ordering, level, slice_idx, 
            #         cumulative_tokens, condition, output_tokens, ...
```

### Analysis plan

1. **Degradation curve:** Plot median Caveman savings % (y) vs cumulative token count (x), with 30-ordering spread as error bars. Does it decay smoothly or show step changes?

2. **Slice attribution regression:**
   ```
   savings_pct ~ cumulative_tokens + S1 + S2 + ... + S10
   ```
   Where `Si` = 1 if slice i is present, 0 otherwise. Significant negative coefficients identify interference components.

3. **Interaction with task category:** Run the regression per-task. Do the same slices matter for all tasks, or do code-heavy vs prose-heavy tasks have different sensitivity profiles?

4. **Overlap validation:** Compare "all 10 slices present" (~17.5K tokens) with Track B baseline medians. If they match, our reconstruction is faithful. If they diverge, the CC CLI adds something beyond the system prompt text (e.g., tool call formatting, turn structure).

### What this does NOT test

- **Leg 2 (CLI, >18K):** Deferred. Track B anchors the 18K point. Extending beyond is secondary.
- **Conversation-style context:** Multi-turn history is too expensive/variable for controlled experiments.
- **Exact CC assembly order:** We deliberately randomize order to separate content from position. If position effects matter (per Lost in the Middle), that's an additional finding, not a confound — the regression would show it.

### Calibration pilot (recommended before full run)

Before committing 3,000 API calls, run a small validation:

| Check | Setup | Runs |
|---|---|---|
| Overlap validation | 1 task × all-10-slices (fixed CC order) × baseline × n=5 | 5 |
| Compare with Track B | Same task's Track B baseline median | (existing data) |
| Shuffle sanity check | 1 task × 3 random orderings × all 10 levels × baseline × n=1 | 30 |
| | **Total** | **35** |

If the all-10-slices baseline at ~17.5K tokens produces output lengths in the same ballpark as Track B baselines for that task, the reconstruction is valid. If not, investigate before scaling up.

---

## References

### Context padding & long-context evaluation

1. Liu et al. (2023). *Lost in the Middle: How Language Models Use Long Contexts.* [arXiv:2307.03172](https://arxiv.org/abs/2307.03172)
2. Kamradt (2023). *Needle In A Haystack.* [GitHub](https://github.com/gkamradt/LLMTest_NeedleInAHaystack)
3. Hsieh et al. (2024). *RULER: What's the Real Context Size of Your Long-Context Language Models?* [arXiv:2404.06654](https://arxiv.org/abs/2404.06654)
4. Kuratov et al. (2024). *BABILong: Testing the Limits of LLMs in Long Context Reasoning.* [arXiv:2406.10149](https://arxiv.org/abs/2406.10149)
5. Bai et al. (2024). *LongBench v2: Towards Deeper Understanding and Reasoning on Realistic Long-context Multitasks.* [arXiv:2412.15204](https://arxiv.org/abs/2412.15204)
6. Luo et al. (2025). *Sequential Needle in a Haystack.* [arXiv:2504.04713](https://arxiv.org/abs/2504.04713)
7. Wang et al. (2024). *Multimodal Needle in a Haystack.* [arXiv:2406.07230](https://arxiv.org/abs/2406.07230)
8. *How Is LLM Reasoning Distracted by Irrelevant Context?* (2025). [arXiv:2505.18761](https://arxiv.org/abs/2505.18761)

### KV cache & compression

9. *KVzip: Query-Agnostic KV Cache Compression.* (2025). [arXiv:2505.23416](https://arxiv.org/abs/2505.23416)
10. *A Comprehensive Survey of KV Cache Compression.* (2024). [arXiv:2407.01527](https://arxiv.org/abs/2407.01527)

### Claude Code system prompt architecture

11. Piebald-AI. *claude-code-system-prompts.* [GitHub](https://github.com/Piebald-AI/claude-code-system-prompts) — canonical extraction, 110+ files, per-section token counts, updated per CC release.
12. Breunig (2026). *How Claude Code Builds a System Prompt.* [Blog](https://www.dbreunig.com/2026/04/04/how-claude-code-builds-a-system-prompt.html) — assembly order, component categories, cacheable vs dynamic split.
13. Kotrotsos. *Inside Claude Code's Prompt Architecture.* [Medium](https://kotrotsos.medium.com/inside-claude-codes-prompt-architecture-ca0803162d82) — 28 prompt files, modular assembly.
