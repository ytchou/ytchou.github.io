import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Screenshot standard: see docs/patterns/resource-screenshots.md.
const SCREENSHOT_WIDTH = 1280;
const SCREENSHOT_HEIGHT = 800;
// GitHub repos use the repo's social card scaled to 1280x640 and pasted at y=40 on white.
// Rows next to the card edges are skipped because webp compression bleeds into them.
const GITHUB_MARGIN_ROWS = [[0, 36], [684, SCREENSHOT_HEIGHT]];
const WHITE_MIN = 250;

async function checkScreenshot(catalog) {
  const file = path.resolve('public', catalog.screenshot.slice(1));
  await access(file);
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== SCREENSHOT_WIDTH || info.height !== SCREENSHOT_HEIGHT) {
    throw new Error(`${catalog.id} screenshot is ${info.width}x${info.height}; expected ${SCREENSHOT_WIDTH}x${SCREENSHOT_HEIGHT}.`);
  }
  if (new URL(catalog.url).hostname !== 'github.com') return;
  for (const [start, end] of GITHUB_MARGIN_ROWS) {
    for (let i = start * info.width * info.channels; i < end * info.width * info.channels; i++) {
      if (data[i] < WHITE_MIN) {
        throw new Error(`${catalog.id} is a GitHub repo but its screenshot does not use the standard social-card frame.`);
      }
    }
  }
}

const expectedGroups = {
  inspiration: ['mobbin', 'macapp-supply', 'loadmore', 'noiced', 'recent-design', 'dribbble', 'best-website-templates', 'footer-design', 'details-so', 'awwwards', 'inspo', 'posts-design', 'deck-gallery', 'logosystem', 'logos-lndev', 'brand-guidelines', 'color-bears', 'morphin'],
  'components-motion': ['component-gallery', '21st-dev', 'lander-figma-blocks', 'forever-components', 'uiverse', 'opensource-ui', 'halaska-ui', 'boardui', 'shadcn-ui', 'react-aria', 'aceternity-ui', 'magic-ui', 'react-bits', 'kinetics', 'eldora-ui', 'css-text-effects', 'generative-loaders', 'threeui', 'transitions-dev'],
  'type-icons-diagrams': ['fonts-in-use', 'free-faces', 'reicon', 'excalidraw', 'diagram-design'],
  'design-engineering': ['web-interface-guidelines', 'pasito', 'vaul', 'manage-design-projects', 'developing-taste', 'impeccable', 'agentation', 'boneyard', 'design-engineer-tools', 'refero-styles', 'ui-design-dictionary', 'vibe-coding-glossary', 'jakub-antalik'],
  'agentic-security': ['cloudflare-security-audit-skill', 'visa-vulnerability-agentic-harness', 'shannon', 'snyk-agent-scan', 'codex-security'],
};

const catalogPath = path.resolve('src/content/resources.json');
const catalogs = JSON.parse(await readFile(catalogPath, 'utf8'));
const expectedIds = Object.values(expectedGroups).flat();
const ids = catalogs.map(catalog => catalog.id);
const urls = catalogs.map(catalog => new URL(catalog.url).href.replace(/\/$/, ''));

if (catalogs.length !== expectedIds.length) {
  throw new Error(`Expected ${expectedIds.length} catalogs, found ${catalogs.length}.`);
}
if (new Set(ids).size !== ids.length) throw new Error('Resource IDs must be unique.');
if (new Set(urls).size !== urls.length) throw new Error('Resource URLs must be unique after normalization.');

for (const catalog of catalogs) {
  if (!expectedGroups[catalog.group]?.includes(catalog.id)) {
    throw new Error(`${catalog.id} has an unexpected group: ${catalog.group}.`);
  }
  const expectedTopic = catalog.group === 'agentic-security' ? 'security' : 'design';
  if ((catalog.topic ?? 'design') !== expectedTopic) {
    throw new Error(`${catalog.id} has an unexpected topic: ${catalog.topic ?? 'design'}.`);
  }
  for (const field of ['description', 'bestFor']) {
    if (!catalog[field]?.en || !catalog[field]?.zh) throw new Error(`${catalog.id} is missing localized ${field} copy.`);
  }
  if (!Array.isArray(catalog.tags) || catalog.tags.length < 1 || catalog.tags.length > 3) {
    throw new Error(`${catalog.id} must have one to three tags.`);
  }
  if (!catalog.screenshot.startsWith('/images/resources/catalogs/')) {
    throw new Error(`${catalog.id} has an invalid screenshot path.`);
  }
  await checkScreenshot(catalog);
}

console.log(`Validated ${catalogs.length} resources and their screenshots.`);
