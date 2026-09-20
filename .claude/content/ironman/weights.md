# iThome Ironman — scoring weights

The series reads like a technically-capable PM explaining why the system looks
the way it does, not an engineer explaining how it works. Weighted accordingly.

| dimension | weight |
|---|---|
| pattern-removal | 6 |
| voice-authenticity | 14 |
| thought-density | 16 |
| structural-variety | 6 |
| protection-fidelity | 8 |

## Pack-specific dimension criteria

These override the generic criteria in `humanizer_scoring.md` when scoring
articles in this series. The 10/7/4/1 scale and protocol stay the same.

### Thought Density (weight 16)

For this series, density is not "information per character" — it is **decision
value per character**. A paragraph about Zod validation internals is
information-dense, but the information doesn't help the reader make decisions
in their own project. A paragraph comparing three approaches to data ingestion,
naming what each costs and buys, is decision-dense.

| Score | Criteria |
|---|---|
| 10 | Every section explains a decision or tradeoff the reader can reuse; implementation detail appears only to make a decision concrete (one sentence) or illustrate a failure; no paragraph whose sole purpose is to describe mechanism |
| 7 | 1–2 paragraphs describe mechanism without connecting to a decision; the rest is decision-level |
| 4 | Multiple sections read like documentation — they explain HOW the system works, not WHY it was built this way |
| 1 | Reads like a technical README with a narrative wrapper; the reader learns the system's internals but not the reasoning behind them |

### Voice Authenticity (weight 14)

The author's voice is a PM who builds: they start from the product problem,
name the constraint, compare approaches, state the tradeoff, and mention the
implementation in one sentence. They are NOT an engineer walking through code.

| Score | Criteria |
|---|---|
| 10 | Reads like the author is explaining to a smart colleague why the system looks the way it does; product thinking and technical decisions are interleaved; the reader understands the reasoning, not just the result |
| 7 | Mostly PM voice; 1–2 sections slip into engineer-explaining-code mode |
| 4 | Mixed — some sections explain decisions, others walk through implementation details |
| 1 | Reads like an engineer documenting a system for a handoff; decisions are implied but never stated |

### Pattern Removal (weight 6)

Same as shared criteria. Lower weight because the writing-guide and kill-list
already handle most patterns during drafting.

### Structural Variety (weight 6)

Same as shared criteria. Lower weight because the recurring article shape
(opener → 2–5 sections → closer) and the writing-guide's paragraph rules
already supply structure.

### Protection Fidelity (weight 8)

Same as shared criteria. Factual accuracy matters — numbers, quotes, terms,
and the series' recurring examples must stay intact.
