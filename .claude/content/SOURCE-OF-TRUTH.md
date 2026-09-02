# Notion is the compass

**Check Notion before acting on any content plan, strategy, or series structure.**
Repo documents drift; Notion is where the decisions are actually made.

## Authoritative pages

| Page | Governs |
|---|---|
| [Project: Portfolio](https://app.notion.com/p/3940d2d793cf80ed8fa8ff89d7eda3f2) | The hub. Start here — it links everything below |
| [Patrick Personal Brand & Content Strategy](https://app.notion.com/p/3b50d2d793cf8190807dd5d7c4a6387c) | Positioning, site information architecture, content layers, Threads pillars and cadence |
| [iThome 30-Day Formoria Growth Engineering Plan](https://app.notion.com/p/3b50d2d793cf818fb7dfd0885ff8f1ca) | The 30-day series: chapters, per-day briefs, article template |

Both strategy pages carry an explicit **"Authoritative"** callout and a
*Last updated* date. Trust the date over anything in this repo.

## How to check

```
mcp__notion__notion-fetch  id=https://app.notion.com/p/3940d2d793cf80ed8fa8ff89d7eda3f2
```

Fetch the hub, follow the two links under "Authoritative Strategy", and compare
against whatever the repo says before writing anything.

## Why this file exists

On 2026-08-16 a full 30-article series was generated from
`docs/strategy/ithome-ironman-2026-series.md` (dated 2026-08-06). Notion had
been updated on 2026-08-07 with a re-framed series — different name, six
chapters instead of five acts, nine new articles, seven merged away, a different
per-article template, and an explicit instruction that the personal site must
**not** carry daily duplicates.

Every one of those 30 skeletons was wrong. The repo document gave no indication
it had been superseded, because a superseded document never does.

## The standing rule

A repo doc describing strategy is a **cache**, not a source. Before acting on
one, fetch the Notion page it derives from and check the date. If the repo doc
has no Notion pointer, that is a defect — add one.
