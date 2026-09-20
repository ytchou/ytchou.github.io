# Consolidate About into Home

**Date:** 2026-09-20
**Status:** Approved

## Intent

Remove the thin standalone About destination and make Home the complete portfolio overview without weakening its portfolio-first hierarchy.

This supersedes only the previous decisions that assigned the portrait and journey exclusively to About.

## Fixed decisions

- Home is ordered as identity and contact icons, Writing, Projects, Journey, then Resources.
- The identity block uses Email, GitHub, and LinkedIn icon links; the portrait is removed.
- The complete existing journey timeline moves to Home unchanged, headed `一路走來` or `My journey`.
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
| Writing, Projects, Resources | Reuse their existing components unchanged |
| Header and Footer | Modify the existing components |
| Portrait | Remove the unused asset rather than relocate it |

Spacing, dividers, icon gaps, and hover timing may be polished within existing design tokens.
