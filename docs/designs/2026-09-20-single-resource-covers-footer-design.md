# Single Resource Covers and Contact Footer

**Date:** 2026-09-20
**Status:** Approved

## Intent

Replace the resource-topic collages with stable category artwork and make the global footer feel like a conventional, useful portfolio contact surface.

This supersedes only the collage and footer-content decisions in the previous editorial and project-family resource designs.

## Fixed decisions

- Design and Security each use one 1280×720 theme-neutral SVG imported through Astro.
- The Design cover uses an editorial grid and olive focal block. The Security cover uses connected nodes and a scanning path in the same visual system.
- Covers are decorative, remain consistent across locales, and appear on both Home and the Resources hubs.
- Topic routes, counts, heading levels, 16:9 layout, responsive behavior, hover, focus, and reduced-motion behavior remain unchanged.
- The footer shows `© {year} Patrick C.` on the left.
- The right side contains a localized Contact link plus bare GitHub and LinkedIn marks inside accessible 48px targets.
- Contact uses the existing localized route. Social links retain their current external URLs and new-tab behavior.
- No new component, icon package, route, schema, API, or public interface is introduced.

## Component reuse

| Surface | Decision |
| --- | --- |
| Topic cards | Simplify `ResourcesHub.astro`; no new component |
| Topic art | Add two Astro-managed SVG assets |
| Footer | Reuse `Footer.astro` and its existing responsive shell |
| Contact and social destinations | Reuse translations, localized Contact routes, and `contactLinks` |
| Social marks | Inline two one-use SVGs; no shared icon abstraction |

Exact geometric placement, stroke weight, spacing, and hover timing may be polished within the existing tokens.
