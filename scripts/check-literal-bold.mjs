import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// Markdown leaves `**` as text when bold cannot close, e.g. `**指標：**用`:
// a closing `**` after punctuation and before a CJK character. Keep the
// punctuation outside the bold: `**指標**：用`. Run after `npm run build`.
const DIST = path.resolve('dist');
const IGNORED = /<(pre|code|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;

const files = (await readdir(DIST, { recursive: true }))
  .filter((file) => file.endsWith('.html'));

const failures = [];
for (const file of files) {
  const text = (await readFile(path.join(DIST, file), 'utf8')).replace(IGNORED, '');
  for (const match of text.matchAll(/\*\*/g)) {
    const context = text.slice(Math.max(0, match.index - 20), match.index + 20).replace(/\s+/g, ' ');
    failures.push(`${file}: …${context}…`);
  }
}

if (files.length === 0) {
  console.error('No HTML found in dist/. Run `npm run build` first.');
  process.exit(1);
}
if (failures.length > 0) {
  console.error(`Found ${failures.length} literal ** in rendered pages. Move punctuation outside the bold, e.g. **指標**：用\n`);
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Checked ${files.length} pages: no literal **.`);
