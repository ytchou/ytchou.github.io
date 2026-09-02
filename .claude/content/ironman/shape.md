# iThome Ironman — article shape

length_unit: cjk
length_min: 1200
length_max: 2500
images_min: 0
images_max: 4

## The fixed template (Notion §33)

Every article uses the same six sections:

1. **問題** — 今天真正遇到什麼產品／使用者問題？
2. **原本的假設** — 我以為會怎樣？
3. **實作** — 技術與系統怎麼設計？
4. **結果** — 真實數據／失敗／trade-off。
5. **Lesson** — 什麼可以被其他 builder 重複使用？
6. **Founder Takeaway** — 用 3–5 句翻譯給非技術 founder。

The template is fixed across all 30. Do not restructure it per article. Days
whose implementation has not landed yet (see `series.md` deadlines) still use
all six sections; section 4 carries the real numbers or an explicit TODO.

## Chapters (v5, 2026-09-02)

| Chapter | Days | Theme |
|---|---|---|
| 1 | 01–02 | 問題與定義 |
| 2 | 03–05 | 產品的地基：資料與設計 |
| 3 | 06–20 | AI Engineering — six capabilities, each with dedicated days |
| 4 | 21–24 | 被看見：SEO 的三個層次 |
| 5 | 25–30 | 一人團隊的作業系統 |

`series.md` is the authoritative day→chapter→capability map.

## Artifacts

Density varies by topic. Section 4 (結果) is where real data belongs — a trace,
an eval table, a cost report, a before-and-after. Day 21 specifically needs the
incorrect Google snippet screenshot; Days 15–16 lean on Langfuse screenshots.

iThome enforces a 300 Chinese-character minimum; this floor sits well above it.
