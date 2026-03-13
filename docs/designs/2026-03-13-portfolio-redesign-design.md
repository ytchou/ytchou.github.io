# Portfolio Redesign — Design Doc

**Date:** 2026-03-13
**Hat:** CTO
**Scope:** Visual redesign + Tailwind CSS + Astro i18n (EN/ZH-TW)

---

## Context

The existing portfolio at `ytchou.github.io` uses the Astro blog template's default styles, which look generic. This redesign replaces all visual styles with a polished, minimal design system and adds bilingual support (English + Traditional Chinese / Taiwan) using Astro 5's native i18n routing.

**Inspirations:** Dante Astro theme (hero layout, card grids), Devosfera (typography, subtle hover interactions), AstroPaper (simplicity — not its blog listing or tag-heavy UI).

---

## Visual Design

### Aesthetic
Clean, minimal, light mode only. No dark mode. Typography-first. Generous whitespace. Content-forward — no decorative elements competing with the text.

### Typography
- **Font:** Inter (variable font, self-hosted via Fontsource) — modern, legible at all sizes
- **Scale:** Tailwind's default type scale (sm/base/lg/xl/2xl/3xl/4xl)
- **Body:** 18px base, 1.7 line-height for readability

### Color Palette
- **Background:** `#fafafa` (off-white, not harsh white)
- **Text:** `#111827` (near-black)
- **Muted:** `#6b7280` (gray-500)
- **Accent:** `#4f46e5` (indigo-600) — links, buttons, active nav
- **Border:** `#e5e7eb` (gray-200)

### Layout
- **Content column:** 720px max-width, centered
- **Grid:** 8px Tailwind spacing system
- **Breakpoints:** Mobile-first, single column → 2-column grid on md+

---

## Pages & Components

### Home Page
```
[Nav: Yung-Tang Chou | About Projects Blog Contact | EN/中]

  Yung-Tang Chou
  Software engineer based in Taiwan.
  Building products that matter.

  [See my work ↗]  [Get in touch]

  ────────────────────────────────
  Recent Writing

  · Hello World                         Mar 2026 →
  · Why I Built This Site               Mar 2026 →

  All posts →

  ────────────────────────────────
  Featured Projects

  [Card: title, desc, tags, links]  [Card]

  All projects →

[Footer: © 2026 Yung-Tang Chou | Yung-Tang Chou 周永唐]
```

### Navigation
Single line, logo left, nav links + language toggle right. No hamburger on desktop. Mobile: stacked.

```
  Yung-Tang Chou     About  Projects  Blog  Contact  [EN | 中]
```

### Blog Listing (`/blog`, `/zh/blog`)
Chronological list. No tag filters on the listing page. Each entry: title (linked), date, 1-line description. Tags appear inside individual posts only. Pinned/featured posts shown first with a subtle accent dot.

```
  Blog
  ────────────────────────────────
  ● Hello World                         Mar 13, 2026
    My first post on this site.

    Why I Built This Site                Mar 13, 2026
    The story behind this site.
```

### Projects Page (`/projects`, `/zh/projects`)
Card grid (2-col on desktop). Each card: title, short description, tech tag pills, GitHub/Live links. Cards have a subtle box-shadow lift on hover.

### Individual Blog Post
Clean article layout: large `h1`, date + tags below title, then prose content. No sidebar. Related posts at bottom (optional, Phase 2).

### About Page
Bio section + skills list. Single column, no grid.

### Contact Page
Social links list (Email, GitHub, LinkedIn) + Calendly CTA button. Clean, uncluttered.

---

## i18n Architecture

### Routing
Astro 5 native i18n routing:
- **English (default):** No URL prefix — `/`, `/blog/`, `/blog/hello-world`
- **Traditional Chinese:** `/zh/` prefix — `/zh/`, `/zh/blog/`, `/zh/blog/hello-world`

### UI Strings
All nav labels, footer text, page headings, CTA copy stored in `src/i18n/ui.ts`:
```ts
export const languages = { en: 'English', zh: '中文' };
export const defaultLang = 'en';
export const ui = {
  en: { 'nav.about': 'About', 'nav.projects': 'Projects', ... },
  zh: { 'nav.about': '關於', 'nav.projects': '專案', ... },
};
```

### Blog Content
- English posts: `src/content/blog/hello-world.md`
- Chinese posts: `src/content/blog/zh/hello-world.md`
- Posts not translated: shown in original language only (not hidden)
- Language switcher in nav links to the translated page if it exists, otherwise the default

### SEO
- `hreflang` alternate links in `<head>` for every page with a translation
- Sitemap includes all language variants
- `lang` attribute on `<html>` set per locale (`en` / `zh-TW`)

---

## Tech Stack Changes

| What | Current | New |
|------|---------|-----|
| Styling | Template CSS (global.css) | Tailwind CSS v4 |
| Typography | Atkinson Hyperlegible | Inter (variable, Fontsource) |
| i18n | None | Astro 5 native i18n |
| Content structure | Flat `src/content/blog/` | Flat EN + `zh/` subfolder for ZH |

---

## Acceptance Criteria

- [ ] Home page renders hero, recent posts, featured projects
- [ ] Blog listing is chronological, no tag filter UI, pinned posts marked
- [ ] Projects page shows card grid with hover effect
- [ ] Language toggle in nav switches between EN and ZH-TW
- [ ] `/zh/` routes serve Traditional Chinese UI strings
- [ ] ZH blog post renders at `/zh/blog/[slug]`
- [ ] `hreflang` tags present on all pages with translations
- [ ] `lang="zh-TW"` set on `<html>` for Chinese pages
- [ ] Build passes with 0 type errors
- [ ] Site deploys to `ytchou.github.io` via GitHub Actions

---

## Out of Scope (this version)

- Dark mode toggle
- Blog search / tag filtering
- Related posts
- RSS per-language feed
- Comments system
