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

export function getAlternateLangUrl(url: URL, lang: Lang): string {
  const path = url.pathname;
  if (lang === 'zh') {
    return path.startsWith('/zh') ? path : `/zh${path === '/' ? '' : path}`;
  }
  return path.startsWith('/zh') ? path.slice(3) || '/' : path;
}
