# Content pack registry

**Notion is the compass — see `SOURCE-OF-TRUTH.md` before acting on any plan.**

Maps output path to voice pack. **First match wins**, so list most-specific first.
Resolved by `~/.claude/skills/shared/content/check.py pack <file>`.

| path glob | pack |
|---|---|
| content/ironman/** | ironman |
| marketing/items/ironman-** | threads |
| src/content/blog/zh/growth-log-** | growth-log |
| src/content/blog/zh/essay-** | evergreen |
| src/content/blog/** | analysis |

`content/ironman/` is **not** rendered by Astro. Notion rules that complete daily
articles stay canonical on iThome and the personal site carries an index,
one-line summaries, links, and synthesis essays — not daily duplicates. Those
drafts are authored here and pasted to iThome.

Pack files live in `.claude/content/<pack>/`. Each declares its parent in
`pack.md` (`extends:`); base and medium layers live in `~/.claude/content-packs/`.
