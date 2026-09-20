# Consolidate About into Home — Implementation Plan

## Wave 1: Homepage consolidation

1. Update the bilingual editorial journey for Home contact icons, Journey content, removed About navigation, and localized redirects.
2. Add the shared social-icon row and reuse it from Home and Footer.
3. Move `JourneyTimeline` to both homepages between Projects and Resources.
4. Remove the About pages, portrait asset, stale translation keys, and Header link; add localized redirects.

Verification: confirm the updated journey fails against the current structure, then run the scoped editorial journey after implementation.

## Wave 2: Production verification

1. Run `pnpm astro check`, `pnpm build`, and `pnpm test:e2e`.
2. Inspect Home at 375px, 768px, and desktop widths in both themes.
3. Check section order, page length, keyboard focus, 48px icon targets, and reduced motion.

## Acceptance criteria

- Home is ordered identity, Writing, Projects, Journey, Resources in both locales.
- Home and the Projects page render the same project collection.
- Home exposes accessible Email, GitHub, and LinkedIn icons with correct link behavior.
- About is absent from navigation and its former routes redirect to the matching homepage locale.
- The portrait is absent; Contact, Footer, previews, and destination routes remain intact.
- Existing uncommitted Agentation-removal changes remain untouched.
