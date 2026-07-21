#!/usr/bin/env node

/**
 * content-reconcile.mjs
 *
 * Reads content items and published blog entries, then syncs status to Supabase.
 * - Published items (with blog entry): status=published, published_urls set
 * - Unpublished items: phase synced from latest existing phase file
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY env vars');
  process.exit(1);
}

const CONTENT_DIR = 'content/items';
const BLOG_DIR = 'src/content/blog';
const BLOG_ZH_DIR = 'src/content/blog/zh';
const BASE_URL = 'https://ytchou.github.io';

// Phase files in priority order (highest first)
const PHASE_FILES = ['final.md', 'reviewed.md', 'draft.md'];
const PHASE_MAP = {
  'final.md': 'humanize',
  'reviewed.md': 'review',
  'draft.md': 'draft',
};

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) fm[key] = val;
  }
  return fm;
}

async function patchItem(slug, data) {
  const url = `${SUPABASE_URL}/rest/v1/content_items?id=eq.portfolio/${slug}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    console.error(`PATCH failed for ${slug}: ${res.status} ${await res.text()}`);
  } else {
    console.log(`Synced ${slug}:`, JSON.stringify(data));
  }
}

async function main() {
  if (!existsSync(CONTENT_DIR)) {
    console.log('No content/items directory found, nothing to reconcile.');
    return;
  }

  // Collect published blog slugs
  const blogSlugs = new Set();
  if (existsSync(BLOG_DIR)) {
    for (const f of readdirSync(BLOG_DIR)) {
      if (f.endsWith('.md')) blogSlugs.add(basename(f, '.md'));
    }
  }

  // Collect zh blog slugs
  const zhSlugs = new Set();
  if (existsSync(BLOG_ZH_DIR)) {
    for (const f of readdirSync(BLOG_ZH_DIR)) {
      if (f.endsWith('.md')) zhSlugs.add(basename(f, '.md'));
    }
  }

  const items = readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const slug of items) {
    if (blogSlugs.has(slug)) {
      // Published — set status and URLs
      const urls = { en: `${BASE_URL}/blog/${slug}` };
      if (zhSlugs.has(slug)) {
        urls.zh = `${BASE_URL}/zh/blog/${slug}`;
      }
      await patchItem(slug, {
        status: 'published',
        published_urls: urls,
      });
    } else {
      // Not published — sync phase from latest phase file
      let phase = null;
      for (const pf of PHASE_FILES) {
        if (existsSync(join(CONTENT_DIR, slug, pf))) {
          phase = PHASE_MAP[pf];
          break;
        }
      }
      if (phase) {
        await patchItem(slug, { phase });
      } else {
        console.log(`No phase files found for ${slug}, skipping.`);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
