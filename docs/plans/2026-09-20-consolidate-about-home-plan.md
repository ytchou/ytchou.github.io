# Consolidate About into Home — Implementation Plan

## Wave 1: Homepage consolidation

1. Update the bilingual editorial journey for Home contact icons, Journey content, removed About navigation, and localized redirects.
2. Add the shared social-icon row and reuse it from Home and Footer.
3. Place `JourneyTimeline` inside both homepage identity introductions, below the social icons.
4. Remove the About pages, portrait asset, stale translation keys, and Header link; add localized redirects.
5. Use the existing gallery width on Home and render projects as a responsive two-column grid matching Resources.
6. Use preview-specific Home headings and make each shared project card one compact link to its live project.
7. Distinguish series metadata in post rows and use `Day N |` consistently for series titles and navigation.

Verification: confirm the updated journey fails against the current structure, then run the scoped editorial journey after implementation.

## Wave 2: Production verification

1. Run `pnpm astro check`, `pnpm build`, and `pnpm test:e2e`.
2. Inspect Home at 375px, 768px, and desktop widths in both themes.
3. Check section order, page length, keyboard focus, 48px icon targets, and reduced motion.

## Acceptance criteria

- Home is ordered identity with inline Journey and social links, Writing, Projects, Resources in both locales.
- Home and Footer order LinkedIn, GitHub, and Email consistently; Footer has no Contact text link.
- Home and the Projects page render the same project collection.
- Project cards expose one secure new-tab destination and no separate action row.
- Home aligns to the gallery-width shell and shows two project columns above the mobile breakpoint.
- Home exposes accessible Email, GitHub, and LinkedIn icons with correct link behavior.
- About is absent from navigation and its former routes redirect to the matching homepage locale.
- The portrait is absent; Contact, Footer, previews, and destination routes remain intact.
- Existing uncommitted Agentation-removal changes remain untouched.
