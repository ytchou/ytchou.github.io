import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const expectedGroups = {
  'interface-web-inspiration': ['mobbin', 'noiced', 'recent-design', 'dribbble', 'best-website-templates', 'awwwards'],
  'brand-editorial-social': ['posts-design', 'deck-gallery', 'logosystem', 'brand-guidelines'],
  typography: ['fonts-in-use', 'free-faces'],
  'component-discovery': ['component-gallery', '21st-dev', 'lander-figma-blocks', 'forever-components'],
  foundations: ['shadcn-ui', 'react-aria'],
  'motion-expressive-ui': ['morphin', 'aceternity-ui', 'magic-ui', 'react-bits', 'kinetics', 'eldora-ui'],
  'visualization-diagramming': ['excalidraw'],
  'icons-supporting-tools': ['reicon', 'icon-animator'],
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
if (ids.join(',') !== expectedIds.join(',')) throw new Error('Catalog editorial order does not match the approved design.');

for (const catalog of catalogs) {
  if (!expectedGroups[catalog.group]?.includes(catalog.id)) {
    throw new Error(`${catalog.id} has an unexpected group: ${catalog.group}.`);
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
  await access(path.resolve('public', catalog.screenshot.slice(1)));
}

console.log(`Validated ${catalogs.length} design resources and their screenshots.`);
