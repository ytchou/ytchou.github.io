# Portfolio — project rules

Astro 7 + Tailwind 4 site, deployed to GitHub Pages. Mandarin (zh-TW) owns the default URLs; English lives under `/en/`.

## Tooling

- **npm only.** Deploy runs `npm ci`; pnpm desyncs `package-lock.json` and breaks the build.
- Dev: `npm run dev` · Build: `npm run build` · Types: `npx astro check` · E2E: `npm run test:e2e -- <spec>`
- After editing `src/content.config.ts`, restart the dev server; collections stay empty until it restarts.

## Page layout: use the shared pieces, never hand-roll them

Every page:

```astro
<BaseLayout title="…">
  <PageHeader title="…" description="…" back={{ href: '/blog', label: '← 所有文章' }} />
  …
</BaseLayout>
```

- `BaseLayout` sets the page frame. Do not add a `max-width` wrapper or a width prop to a page.
- `PageHeader` (`src/components/PageHeader.astro`) renders the back link, optional `eyebrow`, `<h1>`, description, and a slot for extras (post meta, counts). Do not write `<header>` + `<h1>` by hand.
  - `variant="page"` (default): short section labels (文章, 鐵人賽).
  - `variant="article"`: sentence-long post titles.
- The home page hero (`.home-hero`) is the one deliberate exception.

Sizes come from tokens in `src/styles/global.css`. Change the token, not a page:

| Token | Use |
|---|---|
| `--container-width` | Frame width for header, main, and footer |
| `--reading-width` | Max width of long-form post text |
| `--title-page` / `--title-article` | `PageHeader` title sizes |

Shared classes (`.page-header`, `.page-title`, `.page-description`, `.page-eyebrow`, `.back-link`) live in the "Shared page headings" section of `global.css`. Do not redefine them in a scoped `<style>`.

## Blog posts

- Posts live in `src/content/blog/zh/`. `BlogPostLayout` adds the sticky TOC when a post has 2+ `##` headings.
- A post is a series post only when its frontmatter sets `series:` (with `day:`). Series posts get the `Day N / total` eyebrow and the series pill; posts without `series:` get plain tag pills.
- Series titles and lengths live in `src/data/series.ts`, keyed by the `series` value. A new series is one entry there, not layout code.
- Keep `Day N` out of post titles in content; the layout adds it to the eyebrow and the browser tab title.

## Tests

- E2E specs in `e2e/tests/` match visible text and selectors. When you change headings, labels, or header markup, grep `e2e/` for the old text and update the specs in the same PR.
- Never assert a curated content order (e.g. "the first card is X"); test the ordering logic instead.
