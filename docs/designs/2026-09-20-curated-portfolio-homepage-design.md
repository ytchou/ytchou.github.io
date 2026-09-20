# Curated Portfolio Homepage

**Date:** 2026-09-20
**Status:** Approved

## Intent

Give the homepage a distinct portfolio role: introduce Patrick and route visitors to Writing, Projects, Resources, and About. Writing keeps its own complete archive instead of sharing the homepage's purpose.

This supersedes only the homepage composition in the 2026-09-18 editorial portfolio design. Its typography, theme, bilingual routing, archive behavior, and focused destination pages remain unchanged.

## Fixed decisions

- `/` and `/en/` use the existing 720px editorial column.
- The introduction is text-only: Patrick C., the existing role and tagline, and an About link.
- Writing, Projects, and Resources appear as vertically stacked sections with quiet dividers and links to their complete destinations.
- Writing previews the latest three locale-selected posts.
- Projects previews one featured project, falling back to the first project when no project is featured.
- Resources previews every current non-empty resource topic, presently Design and Security.
- `/blog` and `/en/blog` remain complete archives and the primary Writing navigation continues to point to them.
- Portrait, journey timeline, filters, and complete catalogs remain on their focused pages.

## Component reuse

| Surface | Decision |
| --- | --- |
| Post rows | Reuse `BlogPostCard.astro`; allow level-three headings on Home |
| Project preview | Reuse `ProjectCard.astro` and the existing `featured` flag |
| Resource topics | Reuse `ResourcesHub.astro` in an embedded mode without its page header |
| Identity | Reuse the existing bilingual role and tagline strings |
| Navigation and layout | Keep `Header.astro` and the default editorial `BaseLayout.astro` behavior |

No new visual component or public route is required.
