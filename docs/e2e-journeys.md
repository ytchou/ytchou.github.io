# E2E journey catalog

Playwright is configured as of 2026-07-29 (`playwright.config.ts`, `npm run test:e2e`, chromium only, preview server on port 4322). Specs live in `e2e/tests/` and run on every PR via `.github/workflows/ci.yml`. Journeys still marked *Queued* below have no spec yet.

The current collection renders 37 Design resources and 4 AI security resources (schema defaults included). **These counts describe the default unfiltered, grid-view state** — the catalog filter chips rewrite both the header total and the per-group `NN` badges, so any assertion on them must run before a chip is clicked or after resetting via `All`.

| Priority | Journey | Routes | Target | Status |
| --- | --- | --- | --- | --- |
| P1 | Open the Mandarin-default portfolio, switch to English, and follow an existing `/zh/blog/**` bookmark | `/`, `/en/`, `/zh/blog/**` | Smoke, Chromium | Covered — `e2e/tests/locale-routing.spec.ts` |
| P1 | Browse the editorial homepage, open the full Writing archive and About page, and verify English-to-Chinese post fallback | `/`, `/en/`, `/blog`, `/en/blog`, `/about`, `/en/about` | Smoke, Chromium | Covered — `e2e/tests/editorial-navigation.spec.ts` |
| P1 | Browse the bilingual Resources hub and open either topic without crossing locales | `/resources`, `/resources/design`, `/resources/security`, `/en/resources`, `/en/resources/design`, `/en/resources/security` | Smoke, cross-browser | Queued |
| P2 | Browse grouped Design and AI security catalogs and open a source in a new tab | `/resources/design`, `/resources/security`, `/en/resources/design`, `/en/resources/security` | Deep, Chromium | Queued |
| P2 | Filter a resource catalog by group and switch between grid and list view | `/resources/design`, `/resources/security`, `/en/resources/design` | Chromium | Covered — `e2e/tests/catalog-controls.spec.ts` |
| P3 | Filter the projects catalog by tag in both locales | `/projects`, `/en/projects` | Chromium | Covered — `e2e/tests/projects-filter.spec.ts` |
