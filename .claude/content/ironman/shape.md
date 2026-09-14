# iThome Ironman — article shape

length_unit: cjk
length_min: 600
length_max: 4000
images_min: 0
images_max: 4
sections_main_min: 2
sections_main_max: 5
required_first_heading: 今天要聊什麼？
required_last_heading: 明天要聊什麼？
first_heading_exempt_days: 1

## Structure is per article (template retired 2026-09-13)

The six-section template from Notion §33 is retired. The author's verdict on
the Day 01 draft: a fixed template does not fit every topic, and the Founder
Takeaway section "doesn't belong in the content at all". Rules now:

- **Sections come from what the day is trying to say.** Phase A reads the
  day's brief and the author's input, then proposes 2–5 main sections between
  the opener and the closer (Day 02 has five), each answering one product or
  engineering question and running problem → why → approach → trade-off →
  bridge (writing-guide §4). The author edits them; that edit is the approval.
- **H2 headings are a claim or a question, in Chinese.** One line that says
  what the section argues or what question it answers; the author's own
  headings are `如何有系統性地抓取資料進資料庫？`,
  `搜尋真正要對應的，是使用者的情境與意圖`, `使用者不知道要找什麼的時候，
  Discovery Layer 要替他先開口`, `如果把這些概念落到產品介面`. Read only the
  headings and the piece's argument should be visible. Bare topic labels
  (`問題`, `實作`, `Lesson`) are out. An English term stays inside a heading
  when the text uses that term.
- **H3 sub-sections are allowed and are usually numbered options**, when a
  section compares approaches or lists the parts of a problem:
  `### 1. 人工整理` / `### 2. Deterministic Code / Adapters Only` /
  `### 3. 導入 AI Agents 做決策`, or `### 1. Query Understanding` /
  `### 2. Product Representation`. Use them when the section has a genuine
  enumeration; do not manufacture one.
- **Formatting the author uses (2026-09-14):** a `---` rule between H2
  sections; bold on the phrase that anchors a concept, roughly once every
  paragraph or two (writing-guide §6); a `>` blockquote only for the example
  query being analyzed, a section thesis worth remembering, or a real
  quotation, zero or one per section (§5); numbered lists for options,
  decisions, and the reader's situations; bulleted lists for short parallel
  examples (§7). Each one marks something the reader should keep.
- **No Founder Takeaway.** No closing section that translates the piece for a
  different reader.
- **Every day opens with `## 今天要聊什麼？` and ends with `## 明天要聊什麼？`**
  (added 2026-09-14). Each is one short paragraph. The opener is the bridge
  from yesterday: one sentence on what yesterday covered, then what today
  covers and why it comes next. The closer is not a recap: it names the
  conceptual bridge today built and gives a concrete reason to read tomorrow
  (writing-guide §14 — 「今天把問題拆成資料、搜尋與探索三層，而三件事情最後都指向
  同一個問題：機器到底要怎麼理解產品？明天就從這裡開始…」, never 「希望大家有所
  收穫，明天繼續」). Day 01 has no opener (nothing to bridge from). This is the iThome convention and
  overrides the base rule that the ending simply stops.
- **Each day spends only its own material.** `series.md` says which day owns
  which example, number, or argument. An opener previews; it does not
  demonstrate. The taxonomy-mismatch passage (「露營要帶的杯子」 vs the
  category tree) belongs to Day 02 and the RAG days, not Day 01.
- **Length band is 600–4000.** The author's Day 01 revision is ~1400 CJK and
  Day 02 is ~3400; problem-definition and comparison days run long, preview
  days run short. iThome's floor is 300.

## Chapters (v5.4, 2026-09-14)

| Chapter | Days | Theme |
|---|---|---|
| 1 | 01–02 | 問題與定義 |
| 2 | 03–05 | 產品的地基：資料與設計 |
| 3 | 06–15 | 資料要先進來：curation agents 與那把尺 |
| 4 | 16–18 | 搜尋要對上情境 |
| 5 | 19–21 | 探索層 |
| 6 | 22–24 | 被看見：SEO 的三個層次 |
| 7 | 25–30 | 維運與那把尺 |

`series.md` is the authoritative day→chapter→capability map.

## Artifacts

Density varies by topic. Section 4 (結果) is where real data belongs — a trace,
an eval table, a cost report, a before-and-after. Day 21 specifically needs the
incorrect Google snippet screenshot; Days 15–16 lean on Langfuse screenshots.

iThome enforces a 300 Chinese-character minimum; this floor sits well above it.
