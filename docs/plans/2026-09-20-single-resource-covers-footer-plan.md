# Single Resource Covers and Contact Footer — Implementation Plan

## Wave 1: Covers and footer

1. Update the affected Playwright journeys first for one topic image and the footer link contract.
2. Add the paired SVG assets and replace resource-driven collage lookup with a static topic-to-cover mapping.
3. Simplify the footer copy, add localized Contact routing, and replace visible profile URLs with accessible inline brand marks.
4. Preserve all resource routes, card behavior, filters, and the existing uncommitted Agentation-removal changes.

Verification: confirm the new assertions fail against the current cards and footer, then run Astro checking.

## Wave 2: Production verification

1. Run `pnpm astro check`, `pnpm build`, and `pnpm test:e2e`.
2. Inspect Home and Resources at 375px, 768px, and desktop widths in both themes.
3. Check keyboard focus, 48px targets, reduced motion, and localized footer destinations.

## Acceptance criteria

- Every topic card contains exactly one correct decorative cover in both locales and on every hub surface.
- Footer copyright is compact and current.
- Contact remains internal and localized; GitHub and LinkedIn remain secure external links with accessible names.
- No resource data, schema, route, public component interface, or dependency changes.
