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
    topic: z.literal('design'),
    category: z.enum(['typography', 'components', 'motion', 'icons', 'accessibility', 'reference']),
    name: z.string().min(1),
    url: z.string().url(),
    tags: z.array(z.string().min(1)).min(1),
    summary: localizedText,
    bestFor: localizedText,
    availability: z.enum(['free', 'freemium', 'paid']),
    license: z.string().min(1).optional(),
    language: z.array(z.string().min(1)).min(1),
    typographyTier: z.enum(['foundation', 'personality', 'display', 'special-use']).optional(),
    addedDate: z.coerce.date(),
    lastCheckedDate: z.coerce.date(),
  }),
});

export const collections = { blog, resources };
