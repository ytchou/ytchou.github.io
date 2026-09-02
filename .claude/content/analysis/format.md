# Portfolio analysis — format

ext: md
publish_target: src/content/blog/
required: title, description, date, tags, lang
tags_closed: no

This line publishes in either language. EN lands at `src/content/blog/<slug>.md`,
zh at `src/content/blog/zh/<slug>.md` with the same filename — the language
toggle pairs them by filename via `getPostSlug` in `src/i18n/utils.ts`.
