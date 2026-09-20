# Curated Portfolio Homepage — Implementation Plan

## Wave 1: Shared interfaces and homepage composition

1. Add semantic heading-level support to post rows and an embedded presentation mode to the resource hub.
2. Add localized complete-directory links and remove the obsolete writing-only homepage introduction copy.
3. Rebuild the Mandarin and English homepages with the shared identity, three latest posts, one project, and both resource topics.

Verification: update the editorial Playwright journey first, confirm it fails against the old homepage, then run Astro type checking.

## Wave 2: Journey and production verification

1. Update the bilingual editorial journey for the curated homepage and preserved Writing archive.
2. Run `pnpm astro check`, `pnpm build`, and `pnpm test:e2e`.
3. Inspect 375px, 768px, and desktop layouts in light and dark themes, including keyboard focus and 48px targets.

## Acceptance criteria

- Home introduces Patrick and gives Writing, Projects, and Resources comparable prominence.
- Home previews no more than three posts, one project, and the current resource topics.
- Writing navigation still opens the complete localized archive.
- English post previews preserve Mandarin fallback markers and destinations.
- About retains exclusive ownership of the portrait and journey timeline.
- Existing project filters, resource catalogs, routes, canonical URLs, and hreflang behavior remain intact.
