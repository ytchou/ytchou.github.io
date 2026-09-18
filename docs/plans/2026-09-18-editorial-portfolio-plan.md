# Editorial Portfolio Redesign — Implementation Plan

## Wave 1: Content model and shared primitives

1. Require blog descriptions, remove pinned metadata, and make publishing fail early when a summary is missing.
2. Add the three approved summaries and preserve the current Day 03 working-tree edits.
3. Add locale-aware post selection that deduplicates by slug and applies English-to-Chinese fallback.
4. Convert the existing blog-card component into the shared editorial row.
5. Add editorial/gallery widths, the global footer, simplified navigation, and shared page-heading styles.

Verification: content validation, Astro type checking, and a production build.

## Wave 2: Routes and page composition

1. Replace both homepages with the intro, latest five rows, and archive link.
2. Replace both blog indexes and the Mandarin tag archive with the shared row.
3. Add bilingual About routes from existing portrait, copy, links, and timeline.
4. Opt Projects and Resources into gallery width and normalize their headers without changing cards or controls.

Verification: Astro type checking, build, and route inspection.

## Wave 3: Journey coverage and responsive verification

1. Update locale-routing assertions for the new article description.
2. Add the editorial navigation E2E journey covering Home, Writing, About, English fallback, and five-post limiting.
3. Run `pnpm astro check`, `pnpm build`, and `pnpm test:e2e`.
4. Inspect 375px, 768px, and desktop layouts in light and dark themes, including keyboard focus and gallery widths.

## Acceptance criteria

- Writing is the only homepage content collection.
- About owns portrait, biography, social links, and journey.
- English feeds show one preferred edition per slug and mark Chinese fallbacks.
- Post listings share one component and no longer expose pinned or reading-time presentation.
- Existing project/resource behavior and all compatibility routes remain working.
