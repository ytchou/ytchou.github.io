import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    lang: z.enum(['en', 'zh']).default('en'),
    pinned: z.boolean().default(false),
  }),
});

const localizedText = z.object({
  en: z.string().min(1),
  zh: z.string().min(1),
});

const resources = defineCollection({
  loader: file('./src/content/resources.json'),
  schema: z.object({
    group: z.enum([
      'interface-web-inspiration',
      'brand-editorial-social',
      'typography',
      'component-discovery',
      'foundations',
      'motion-expressive-ui',
      'icons-supporting-tools',
    ]),
    name: z.string().min(1),
    url: z.string().url(),
    screenshot: z.string().startsWith('/images/resources/catalogs/'),
    tags: z.array(z.string().min(1)).min(1).max(3),
    description: localizedText,
    bestFor: localizedText,
    addedDate: z.coerce.date(),
    lastCheckedDate: z.coerce.date(),
    screenshotCapturedDate: z.coerce.date(),
  }),
});

export const collections = { blog, resources };
