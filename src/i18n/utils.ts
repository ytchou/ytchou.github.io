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

/** Sort blog posts pinned-first, then newest-first. */
export function sortPosts(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'>[] {
  return [...posts].sort((a, b) => {
    if (a.data.pinned !== b.data.pinned) return a.data.pinned ? -1 : 1;
    return b.data.date.valueOf() - a.data.date.valueOf();
  });
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

/** Estimate reading time in minutes from raw markdown content. */
export function getReadingTime(content: string | undefined): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
