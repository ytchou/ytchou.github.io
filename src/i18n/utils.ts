import type { CollectionEntry } from 'astro:content';
import { defaultLang, ui, type Lang, type UIKey } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split('/');
  if (maybeLang === 'en') return 'en';
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return (ui[lang] as Record<string, string>)[key]
      ?? (ui[defaultLang] as Record<string, string>)[key]
      ?? key;
  };
}

/** Sort blog posts newest-first. */
export function sortPosts(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'>[] {
  return [...posts].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/**
 * Select one published edition per slug for a locale.
 * Mandarin stays Mandarin-only. English prefers English and falls back to Mandarin.
 */
export function selectPostsForLang(
  posts: CollectionEntry<'blog'>[],
  lang: Lang,
): CollectionEntry<'blog'>[] {
  const published = posts.filter(post => !post.data.draft);
  if (lang === 'zh') {
    return sortPosts(published.filter(post => post.data.lang === 'zh'));
  }

  const bySlug = new Map<string, CollectionEntry<'blog'>>();
  for (const post of published) {
    const slug = getPostSlug(post.id);
    const current = bySlug.get(slug);
    if (!current || (current.data.lang !== 'en' && post.data.lang === 'en')) {
      bySlug.set(slug, post);
    }
  }

  return sortPosts([...bySlug.values()]);
}

/** Strip the language-directory prefix from a content collection post ID to get a clean URL slug. */
export function getPostSlug(id: string): string {
  return id.startsWith('zh/') ? id.slice(3) : id;
}

export function getAlternateLangUrl(url: URL, lang: Lang): string {
  const path = url.pathname;
  const isEnPath = path === '/en' || path.startsWith('/en/');
  if (lang === 'en') {
    return isEnPath ? path : `/en${path === '/' ? '/' : path}`;
  }
  return isEnPath ? path.slice(3) || '/' : path;
}
