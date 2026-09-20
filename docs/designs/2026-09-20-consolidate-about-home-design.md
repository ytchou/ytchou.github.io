# Consolidate About into Home

**Date:** 2026-09-20
**Status:** Approved

## Intent

Remove the thin standalone About destination and make Home the complete portfolio overview without weakening its portfolio-first hierarchy.

This supersedes only the previous decisions that assigned the portrait and journey exclusively to About.

## Fixed decisions

- Home is ordered as identity, contact icons, journey timeline, Writing, Projects, then Resources.
- Home uses the existing gallery width so its content aligns with the Header, Footer, Projects, and Resources surfaces.
- Home renders the complete shared project collection so it stays in sync with the Projects page.
- Home projects use a two-column grid matching the Resources section, collapsing to one column on mobile.
- Home labels its previews `近期文章` / `Recent writing` and `精選專案` / `Selected projects`.
- Series post previews identify their series explicitly and prefix titles with `Day N |`; standalone posts omit both treatments.
- Each project card is one compact external link to its live project; separate GitHub and live action links are omitted on Home and Projects.
- The identity block uses Email, GitHub, and LinkedIn icon links; the portrait is removed.
- The complete existing journey timeline sits inside the identity introduction, directly below the contact icons and without a separate heading or section.
- Home and Footer order their social icons as LinkedIn, GitHub, then Email.
- Footer uses the shared Email icon instead of a localized Contact text link.
- About disappears from primary navigation.
- `/about` redirects to `/`; `/en/about` redirects to `/en/`.
- A shared social-icon row supplies the same accessible 48px icon treatment to Home and Footer.
- Contact pages, Footer Contact links, content previews, and destination routes remain unchanged.

## Component reuse

| Surface | Decision |
| --- | --- |
| Identity | Extend the existing Home hero |
| Contact icons | Add one shared icon-row component for Home and Footer |
| Career history | Reuse `JourneyTimeline` unchanged |
| Writing, Projects, Resources | Reuse their existing components; make `ProjectCard` one complete live-project link |
| Header and Footer | Modify the existing components |
| Portrait | Remove the unused asset rather than relocate it |

Spacing, dividers, icon gaps, and hover timing may be polished within existing design tokens.
