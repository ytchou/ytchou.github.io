# Project-Family Resources Redesign

**Date:** 2026-09-20
**Status:** Approved

## Intent

Bring Resources into the same visual family as Projects without changing its directory structure or adapting resource data into project data. Topic cards remain collection entry points; individual resource cards remain external destinations.

## Fixed decisions

- Home and both localized Resources hubs show the two topics as a two-card grid on wider screens and one column on mobile.
- Each topic card is one localized internal link with a 16:9 collage, topic label, title, two-line description, resource count, and directional affordance.
- The Design collage uses ThreeUI, Mobbin, and Fonts in Use. The Security collage uses Shannon, Cloudflare Security Audit Skill, and Snyk Agent Scan.
- Curated collage IDs are resolved from the existing resource collection. A missing entry fails the static build instead of silently substituting another image.
- Topic cards remove the reviewed-through date and adopt the existing Project card's border, shadow, hover lift, and image zoom language.
- Every individual resource card is one external link that opens in a new tab and retains its title, description, compact Best for copy, and tags.
- Resource groupings, filters, and grid/list controls remain unchanged. List view continues to hide screenshots.
- Keyboard focus, new-tab labeling, reduced-motion behavior, bilingual routes, and existing content remain intact.

## Component reuse

| Surface | Decision |
| --- | --- |
| Topic entry cards | Extend the existing `ResourcesHub.astro` presentation; do not add a component |
| Individual resources | Restyle `ResourceCard.astro` as a single-link card |
| Projects | Leave `ProjectCard.astro` unchanged as the visual reference |
| Resource data | Keep the existing collection schema and resolve curated IDs at build time |

Exact spacing, line clamps, divider opacity, and transition timing may be polished using existing semantic tokens.
