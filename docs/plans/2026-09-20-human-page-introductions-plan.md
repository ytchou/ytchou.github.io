# Human Page Introductions — Implementation Plan

## Wave 1: Shared copy and page headers

1. Add localized visible-heading and introduction strings without changing navigation or SEO metadata keys.
2. Update the bilingual Writing, Projects, and Contact pages to use the approved copy and remove page eyebrows.
3. Update the Resources hub and resource directories with the approved copy and remove page eyebrows.
4. Remove the tag-archive and article eyebrows while preserving their functional context.
5. Delete the unused global eyebrow style.

Verification: run `pnpm astro check`, inspect changed routes for heading hierarchy and stale eyebrow text, then run the affected Playwright journeys.

## Wave 2: Production verification

1. Run `pnpm build` and `pnpm test:e2e`.
2. Inspect Writing, Projects, Resources, Contact, a resource directory, a tag archive, and an article at 375px and desktop widths in both locales where available.
3. Confirm navigation labels, article metadata, resource counts, filters, and links remain unchanged.

## Acceptance criteria

- No page-level `.section-kicker` remains in rendered source.
- Writing, Projects, Resources, Contact, Design, and Security use the approved bilingual headings and descriptions.
- Articles keep their title, date, tags, series context, and back link without an eyebrow.
- Tag archives keep the tag as the H1 and use a natural count sentence.
- Navigation, cards, filters, URLs, canonical metadata, and external link behavior remain intact.
- The existing uncommitted Agentation-removal changes remain untouched.
