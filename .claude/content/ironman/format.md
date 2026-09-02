# iThome Ironman — format

ext: md
lang: zh
publish_target: content/ironman/
required: title, day, chapter, publish, platform, status, notion
mirror: notion
mirror_field: notion
mirror_status_structure: In Progress
mirror_status_prose: Draft

**The repo file is the draft's home.** `status` is this line's draft flag
(`skeleton` → `drafted` → `reviewed` → `published`); there is no separate
`draft:` field. Filenames are `day-NN-<topic>.md` so they sort by day and the
registry glob matches.

## Mirror: Notion

Every file carries `notion:` — the URL of its row in the Notion Calendar
(Project = Portfolio, Content Type = iThome). After each `/content-draft` phase
passes its gates, the skill replaces that page's content with the file body
(everything below the frontmatter, intent comments stripped) and sets the row's
`Status` to the `mirror_status_*` value for the phase. Notion is a **read
surface** for review and comments; edits made there are not pulled back. Edit
the file, re-run the skill.

**Not an Astro content collection.** These render on iThome, not on the personal
site. Notion rules that the site carries `/writing/ironman-2026` — series intro,
30-day index, a one-line summary per day, and links to the iThome originals.

## Platform: iThome

iThome ships its own online Markdown editor, so articles paste in as raw
Markdown — no HTML conversion, no export target. Its editor can drop connection
and cannot edit offline, which is why articles are authored here.

`![alt](url)` works. Images upload to iThome rather than hotlinking.

**300 Chinese-character minimum** per article.

Source: https://ithelp.ithome.com.tw/articles/10227660
