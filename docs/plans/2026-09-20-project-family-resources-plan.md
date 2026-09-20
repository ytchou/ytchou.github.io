# Project-Family Resources Redesign — Implementation Plan

## Wave 1: Resource card system

1. Update the resource journeys first for localized topic routing and the one-link external card contract.
2. Rebuild the existing topic cards as responsive, image-led cards with fixed three-image collages and build-time validation for curated IDs.
3. Convert individual resource cards to one accessible external link and align their visual behavior with Project cards.
4. Remove the unused collection-freshness helper while preserving filters, group order, and grid/list behavior.

Verification: confirm the updated journeys fail against the previous markup, then run Astro type checking.

## Wave 2: Production verification

1. Run `pnpm astro check`, `pnpm build`, and `pnpm test:e2e`.
2. Inspect Home, Resources, Design, and Security at 375px, 768px, and desktop widths in light and dark themes.
3. Check keyboard focus, hover, new-tab semantics, list view, and reduced-motion behavior.

## Acceptance criteria

- Home and both Resources hubs show two localized project-family topic cards with the approved collages.
- Topic cards open the complete localized topic directory and show counts without freshness dates.
- Every individual resource card exposes exactly one external destination and announces its new-tab behavior.
- Filters, grouping, grid/list preference, routes, content schema, and Project cards remain unchanged.
