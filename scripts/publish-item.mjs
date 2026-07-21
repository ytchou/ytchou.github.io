#!/usr/bin/env node

/**
 * Publish a content item from the pipeline layout to Astro's blog collection.
 *
 * Usage: node scripts/publish-item.mjs <slug> [--dry-run] [--date YYYY-MM-DD]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, copyFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');

// --- CLI parsing ---

const args = process.argv.slice(2);
let slug = null;
let dryRun = false;
let dateOverride = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dry-run') {
    dryRun = true;
  } else if (args[i] === '--date') {
    dateOverride = args[++i];
    if (!dateOverride || !/^\d{4}-\d{2}-\d{2}$/.test(dateOverride)) {
      console.error('Error: --date requires a YYYY-MM-DD value');
      process.exit(1);
    }
  } else if (!slug && !args[i].startsWith('-')) {
    slug = args[i];
  }
}

if (!slug) {
  console.error('Usage: node scripts/publish-item.mjs <slug> [--dry-run] [--date YYYY-MM-DD]');
  process.exit(1);
}

// --- Paths ---

const itemDir = join(ROOT, 'content', 'items', slug);
const finalPath = join(itemDir, 'final.md');
const zhPath = join(itemDir, 'zh.md');
const chartsDir = join(itemDir, 'charts');

const blogDir = join(ROOT, 'src', 'content', 'blog');
const blogZhDir = join(blogDir, 'zh');
const assetsDir = join(ROOT, 'src', 'assets', slug);

if (!existsSync(finalPath)) {
  console.error(`Error: ${finalPath} does not exist`);
  process.exit(1);
}

// --- Frontmatter parsing ---

function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0].trim() !== '---') return { fields: {}, body: content };

  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) return { fields: {}, body: content };

  const fmLines = lines.slice(1, endIdx);
  const fields = {};
  let currentKey = null;

  for (const line of fmLines) {
    // Skip nested/indented lines (e.g. final_scores children)
    if (/^\s+\S/.test(line)) continue;

    const match = line.match(/^(\w[\w_]*):\s*(.*)/);
    if (match) {
      currentKey = match[1];
      let value = match[2].trim();

      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Parse inline array: [tag1, tag2]
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim());
      }

      // Parse numbers
      if (typeof value === 'string' && /^\d+$/.test(value)) {
        value = Number(value);
      }

      fields[currentKey] = value;
    }
  }

  const body = lines.slice(endIdx + 1).join('\n');
  return { fields, body };
}

function buildAstroFrontmatter(fields, lang) {
  const date = dateOverride || new Date().toISOString().slice(0, 10);

  // Description: seo_description → subtitle → description
  const description = fields.seo_description || fields.subtitle || fields.description || '';

  const out = { title: fields.title || '', description, date, lang };

  if (fields.tags) {
    out.tags = Array.isArray(fields.tags) ? fields.tags : [fields.tags];
  }

  return out;
}

function yamlQuote(val) {
  if (typeof val !== 'string') return String(val);
  if (/[:#'"\[\]{},&*?|>!%@`\n]/.test(val) || val.trim() !== val) {
    return `"${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return val;
}

function serializeFrontmatter(obj) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => yamlQuote(v)).join(', ')}]`);
    } else {
      lines.push(`${key}: ${yamlQuote(value)}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// --- Chart relocation ---

function rewriteChartRefs(body, relativePrefix) {
  return body.replace(
    /!\[([^\]]*)\]\(charts\/([^)]+)\)/g,
    (_, alt, file) => `![${alt}](${relativePrefix}${file})`
  );
}

function copyCharts() {
  if (!existsSync(chartsDir)) return false;
  const files = readdirSync(chartsDir);
  if (files.length === 0) return false;

  if (!dryRun) {
    mkdirSync(assetsDir, { recursive: true });
    for (const f of files) {
      copyFileSync(join(chartsDir, f), join(assetsDir, f));
    }
  }
  console.log(`  Charts → ${assetsDir} (${files.length} file${files.length === 1 ? '' : 's'})`);
  return true;
}

// --- Process a single edition ---

function processEdition(srcPath, outPath, lang, imgPrefix) {
  const raw = readFileSync(srcPath, 'utf-8');
  const { fields, body } = parseFrontmatter(raw);
  const astroFm = buildAstroFrontmatter(fields, lang);
  const rewrittenBody = rewriteChartRefs(body, imgPrefix);
  const output = serializeFrontmatter(astroFm) + '\n' + rewrittenBody;

  console.log(`\n  ${outPath}`);
  console.log(`  Frontmatter: ${JSON.stringify(astroFm)}`);

  if (!dryRun) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, output, 'utf-8');
  }
}

// --- Main ---

console.log(`${dryRun ? '[DRY RUN] ' : ''}Publishing "${slug}"…`);

copyCharts();

const enOut = join(blogDir, `${slug}.md`);
processEdition(finalPath, enOut, 'en', `../../assets/${slug}/`);

if (existsSync(zhPath)) {
  const zhOut = join(blogZhDir, `${slug}.md`);
  processEdition(zhPath, zhOut, 'zh', `../../../assets/${slug}/`);
}

console.log(dryRun ? '\nDry run complete — no files written.' : '\nDone.');
