# Human Page Introductions

**Date:** 2026-09-20
**Status:** Approved

## Intent

Replace generic destination-page labels with concise first-person introductions that sound like Patrick, while keeping navigation and content titles literal and easy to scan.

This supersedes only the page-eyebrow and destination-introduction copy from earlier portfolio designs. Routes, content selection, cards, filters, and article titles remain unchanged.

## Fixed decisions

- Remove every page-level eyebrow, including archive, portfolio, directory, tag, resource-topic, and article-series labels.
- Preserve functional back links, card metadata, topic labels, tags, dates, and series navigation because they provide context rather than decorative hierarchy.
- Use first-person headings on Writing, Projects, Resources, Contact, and resource-topic directories.
- Keep article titles and tag names as their page headings.
- Keep navigation labels and metadata concise and descriptive instead of forcing the first-person voice into every surface.
- Reuse the existing page-header structure and typography; add no new component or visual treatment.

## Approved copy

| Destination | Mandarin | English |
| --- | --- | --- |
| Writing | `我正在學的事` — `記錄我在資料科學、AI 工作流程與產品實作中的問題、選擇與心得。` | `What I’m learning` — `Notes from my work in data science, AI workflows, and building products.` |
| Projects | `我正在做的事` — `從資料產品到實用小工具，這些是我把想法做成可用產品的過程。` | `What I’m building` — `Data products and small tools I’ve made to turn ideas into something useful.` |
| Resources | `我反覆使用的資源` — `做設計、研究 AI 安全與打造產品時，我真正會回頭使用的工具與參考。` | `Tools I keep coming back to` — `The sites, references, and open-source tools I rely on for design, AI security, and product work.` |
| Contact | `來聊聊吧` — `有想法、問題，或想聊資料、AI 與產品？寫信給我。` | `Let’s talk` — `Have an idea, a question, or want to talk about data, AI, or products? Send me a note.` |
| Design directory | `我的設計工具箱` — `做介面、品牌、字體與動態時，我會實際回訪的工具和參考。` | `My design toolbox` — `Tools and references I return to when working on interfaces, brands, typography, and motion.` |
| Security directory | `我如何探索 AI 安全` — `這些是我用來理解 AI 輔助安全稽核、找漏洞、修補與驗證的開源工具和方法。` | `How I’m exploring AI security` — `Open-source tools and methods I use to understand AI-assisted audits, vulnerability discovery, remediation, and verification.` |

Tag archives keep the tag as the heading and use a natural count sentence. Article pages remove the eyebrow but keep the existing title, date, tags, and series context.

## Component reuse

| Surface | Decision |
| --- | --- |
| Destination headers | Reuse `.page-header`, `.page-title`, and `.page-description` |
| Writing and Projects | Reuse existing localized page templates |
| Resource hub and directories | Reuse `ResourcesHub` and `ResourcesDirectory` |
| Contact | Reuse the existing contact pages and link data |
| Articles | Reuse `BlogPostLayout`; remove only its decorative eyebrow |

No new component, route, schema, API, or dependency is required.

## Blast radius

| File / symbol | Why it changes | Callers and tests |
| --- | --- | --- |
| `src/i18n/ui.ts` | Adds visible destination heading and introduction strings while preserving navigation and metadata strings | Used by Home, Blog, Projects, Contact, Footer, and social links |
| `src/pages/blog/index.astro`, `src/pages/en/blog/index.astro` | Writing heading, introduction, and eyebrow removal | Editorial navigation journey |
| `src/pages/projects.astro`, `src/pages/en/projects.astro` | Projects heading, introduction, and eyebrow removal | Project-filter journeys |
| `src/pages/contact.astro`, `src/pages/en/contact.astro` | Contact heading, introduction, and eyebrow removal | Footer destination coverage |
| `src/components/ResourcesHub.astro` | Resources heading, introduction, and eyebrow removal | Home, both Resources hubs, and catalog journey |
| `src/components/ResourcesDirectory.astro` | Topic headings, descriptions, and eyebrow removal | Four localized topic routes and catalog-control journey |
| `src/pages/blog/tag/[tag].astro` | Tag eyebrow removal and natural count sentence | Mandarin tag archives |
| `src/layouts/BlogPostLayout.astro` | Article eyebrow removal | Both localized article routes |
| `src/styles/global.css` | Removes the unused eyebrow style | Global page styles |

No content schema, environment, external SDK, or API contract is affected.

## Flexible polish

Line lengths and spacing may be adjusted within existing design tokens during responsive verification. The approved meaning, first-person voice, and absence of page-level eyebrows are fixed.
