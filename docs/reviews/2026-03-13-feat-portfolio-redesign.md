# Code Review Log: feat/portfolio-redesign

**Date:** 2026-03-13
**Branch:** feat/portfolio-redesign
**Mode:** Pre-PR

## Pass 1 — Full Discovery

*Agents: Bug Hunter (Opus), Standards (Sonnet), Architecture (Opus), Plan Alignment (Sonnet)*

### Issues Found (10 total)

| Severity | File:Line | Description | Flagged By |
|----------|-----------|-------------|------------|
| Critical | src/pages/rss.xml.js:13 | ZH posts get link `/blog/zh/hello-world/` (404) instead of `/zh/blog/hello-world` | Bug Hunter |
| Important | src/pages/rss.xml.js:6 | RSS feed includes both EN and ZH posts with English-only metadata | Bug Hunter |
| Important | src/i18n/utils.ts | `id.startsWith('zh/') ? id.slice(3) : id` duplicated in 3 places | Standards |
| Important | src/pages/index.astro, src/pages/blog/index.astro, src/pages/zh/index.astro, src/pages/zh/blog/index.astro | Post sort comparator (pinned-first, date-descending) duplicated 4 times | Standards |
| Important | src/pages/contact.astro, src/pages/zh/contact.astro | `links` array and `calendlyUrl` duplicated in both contact pages | Standards |
| Minor | src/pages/contact.astro:22, src/pages/zh/contact.astro:20 | Label width `w-16` (EN) vs `w-20` (ZH) discrepancy | Standards |
| Minor | src/layouts/BaseLayout.astro:13 | Hardcoded default description string; should use `SITE_DESCRIPTION` from consts.ts | Standards |
| Minor | src/components/ProjectCard.astro | Hover missing `translateY` lift effect (only shadow, no motion) | Plan Alignment |
| Minor | src/pages/about.astro, src/pages/zh/about.astro | Skills array hardcoded, not translated | Standards |
| Minor | Various | Hardcoded name strings not using translation map | Architecture |

### Validation Results
- Skipped (false positive): `src/pages/index.astro:43` — EN post IDs never have `zh/` prefix; `slug: post.id` in route matches `href=/blog/${post.id}` correctly
- Skipped (latent only): Language toggle on blog posts — current EN/ZH post slugs all have matching counterparts; this becomes a bug only if an EN-only post is added in future
- Skipped (acceptable tech debt): Duplicate EN/ZH page templates — Architecture acknowledged manageable for 2-language portfolio
- Skipped (too opinionated): Hardcoded name strings — `t('nav.home')` contains the localized name but mixing it into hero h1 adds complexity without clear benefit
- Skipped (out of scope): Skills array i18n — about page uses placeholder text; full content i18n is future work
- Proceeding to fix: 8 valid issues (1 Critical, 2 Important from Bug Hunter merged as 1 fix, 3 Important from Standards, 3 Minor)

## Fix Pass 1

**Pre-fix SHA:** 4fb273aaa42123219a588df3587a5e98f2048da8

**Issues fixed:**
- [Critical + Important] src/pages/rss.xml.js:6 — Filter RSS to EN posts only; ZH post IDs include `zh/` prefix making links 404
- [Important] src/i18n/utils.ts + 3 call sites — Extract `getPostSlug()` helper; remove duplicated slug-stripping logic
- [Important] src/i18n/utils.ts + 4 pages — Extract `sortPosts()` helper; remove duplicated pinned-first sort comparator
- [Important] src/data/contact.ts (new) + both contact pages + ui.ts — Extract contact links to shared module with translated label keys; standardize label width to `w-20`
- [Minor] src/layouts/BaseLayout.astro — Use `SITE_DESCRIPTION` constant instead of hardcoded string
- [Minor] src/components/ProjectCard.astro — Add `hover:-translate-y-0.5` for lift effect

**Issues skipped (false positives):**
- src/pages/index.astro:43 — EN post IDs have no prefix; links correct

**Batch Test Run:**
- `npm run build` — PASS (14 pages built in 1.95s)
- `npx astro check` — PASS (0 errors, 0 warnings, 0 hints)

## Final State

**Iterations completed:** 1
**All Critical/Important resolved:** Yes
**Remaining issues:** None blocking

**Review log:** docs/reviews/2026-03-13-feat-portfolio-redesign.md
