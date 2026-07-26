# E2E journey catalog

The repository does not currently have a Playwright configuration or E2E test runner. The journeys below are queued until project-level E2E tooling is adopted.

The current collection renders 33 Design resources and 4 AI security resources (schema defaults included). The hub and directory expose those counts with locale-specific labels, so the pending journeys cover both the values and their presentation.

| Priority | Journey | Routes | Intended target | Status |
| --- | --- | --- | --- | --- |
| P1 | Browse the bilingual Resources hub and open either topic without crossing locales | `/resources`, `/resources/design`, `/resources/security`, `/zh/resources`, `/zh/resources/design`, `/zh/resources/security` | Smoke, cross-browser | Blocked: no E2E tooling |
| P2 | Browse grouped Design and AI security catalogs and open a source in a new tab | `/resources/design`, `/resources/security`, `/zh/resources/design`, `/zh/resources/security` | Deep, Chromium | Blocked: no E2E tooling |
