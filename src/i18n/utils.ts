import type { CollectionEntry } from 'astro:content';
import { defaultLang, ui, type Lang, type UIKey } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split('/');
  if (maybeLang === 'zh') return 'zh';
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
  if (lang === 'zh') {
    return path.startsWith('/zh') ? path : `/zh${path === '/' ? '' : path}`;
  }
  return path.startsWith('/zh') ? path.slice(3) || '/' : path;
}
