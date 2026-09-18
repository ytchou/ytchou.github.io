# Editorial Portfolio Redesign

**Date:** 2026-09-18
**Status:** Approved

## Intent

Make writing the primary entry point while keeping professional credibility one click away. The visual direction borrows the compact editorial rhythm of Harry Chung's homepage without copying its monochrome identity: Patrick's Inter typography, olive accent, bilingual routing, and light/dark themes remain.

## Fixed decisions

- `/` and `/en/` show one quiet introductory sentence, the latest five posts, and an All posts link.
- Every listing uses one shared post row: ISO date, first tag, optional `中文` fallback marker, title, and required two-line summary.
- Home and Writing sort newest-first. Series tag pages keep Day 1 to Day N order; other tag pages sort newest-first.
- English feeds prefer an English edition by canonical slug and fall back to Chinese without duplicates. Mandarin feeds remain Mandarin-only.
- Navigation is Writing, Projects, Resources, and About. Theme and language controls stay but lose visible pill borders; mobile uses two rows.
- `/about` and `/en/about` reuse the existing portrait, role, tagline, social links, and journey timeline.
- Contact routes remain valid but leave primary navigation.
- Editorial pages use a 720px column; Projects and Resources use a 1040px gallery column.
- A quiet global footer shows copyright, GitHub, and LinkedIn.
- Project and Resource cards, filters, article routes, redirects, RSS, canonical URLs, and hreflang behavior remain intact.

## Component reuse

| Surface | Decision |
| --- | --- |
| Header and controls | Reuse and simplify `Header.astro` |
| Page widths and footer | Extend `BaseLayout.astro`; activate `Footer.astro` |
| Post rows | Rework the existing unused `BlogPostCard.astro` |
| About portrait and links | Reuse Astro `Image`, `headshot.jpeg`, and `contactLinks` |
| Career timeline | Reuse `JourneyTimeline.astro` unchanged |
| Projects and Resources | Reuse existing cards, directories, and controls |

No new visual component is needed.

## Content contract

Blog `description` becomes required and non-empty. `pinned` is removed. The publishing bridge must stop before writing when no description can be derived from `seo_description`, `subtitle`, or `description`.

The initial summaries are:

- Day 01: 用一個讓台灣小品牌更容易被找到的 Side Project，記錄 30 天學習 AI Agents 的問題、決策與實作。
- Day 02: 在選擇模型與框架以前，先把產品問題拆成資料、搜尋與探索，釐清 AI 真正該出現的位置。
- Day 03: 從 taxonomy、filter 與主觀風格三個層次，整理產品資訊如何變成機器可理解、可搜尋的結構。

## Flexible polish

Exact spacing, muted-color strength, divider opacity, and hover timing may be tuned during responsive verification. These changes must not alter the fixed information architecture or content-selection rules.
