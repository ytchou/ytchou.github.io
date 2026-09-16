// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ytchou.github.io',
  redirects: {
    '/zh': '/',
    '/zh/blog': '/blog',
    '/zh/blog/[slug]': '/blog/[slug]',
    '/zh/blog/tag/[tag]': '/blog/tag/[tag]',
    '/zh/contact': '/contact',
    '/zh/projects': '/projects',
    '/zh/resources': '/resources',
    '/zh/resources/design': '/resources/design',
    '/zh/resources/security': '/resources/security',
    '/zh/ironman': '/blog/tag/鐵人賽',
    '/zh/ironman/day-01-why-this-series': '/blog/day-01-why-this-series',
    '/zh/ironman/day-02-discovery-problem': '/blog/day-02-discovery-problem',
  },
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
