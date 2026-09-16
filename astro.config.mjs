// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ytchou.github.io',
  redirects: {
    '/zh/ironman': '/zh/blog/tag/鐵人賽',
    '/zh/ironman/day-01-why-this-series': '/zh/blog/day-01-why-this-series',
    '/zh/ironman/day-02-discovery-problem': '/zh/blog/day-02-discovery-problem',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
