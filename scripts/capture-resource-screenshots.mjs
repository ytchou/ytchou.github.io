// Captures resource screenshots with one fixed method so every card compares equally.
// Usage: node scripts/capture-resource-screenshots.mjs [id ...]   (no ids = every resource)
// The standard is documented in docs/patterns/resource-screenshots.md and checked by
// scripts/validate-resource-catalog.mjs.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const WIDTH = 1280;
const HEIGHT = 800;
const NETWORK_IDLE_TIMEOUT = 15_000;
const IMAGE_TIMEOUT = 10_000;
// Hero animations and late-rendered content get the same fixed time on every site.
const SETTLE_MS = 3_000;
const CONCURRENCY = 4;
// Sites a headless browser cannot capture cleanly. A full run skips them; passing the id
// captures it anyway. Revisit when the reason no longer holds.
const SKIP_IN_FULL_RUN = {
  uiverse: 'its bot protection blocks headless browsers',
  'color-bears': 'Threads shows a login modal with no close control',
};
// Captures show the page a first-time visitor sees after dismissing banners and popups.
const DISMISS_CONTROL = /^(reject all|reject|decline|deny|necessary only|accept all|accept|allow all|agree|got it|ok|close|dismiss|no thanks|maybe later|×|✕)$/i;

// Banners and sign-up popups often appear late, so this runs before and after the settle wait.
async function dismissOverlays(page) {
  // Some banners use a plain clickable span or div, so match visible text as a fallback.
  for (const controls of [
    page.getByRole('button', { name: DISMISS_CONTROL }),
    page.getByRole('link', { name: DISMISS_CONTROL }),
    page.getByText(DISMISS_CONTROL),
  ]) {
    for (const control of await controls.all()) {
      if (await control.isVisible().catch(() => false)) await control.click({ timeout: 2_000 }).catch(() => {});
    }
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

const catalogPath = path.resolve('src/content/resources.json');
const today = new Date().toISOString().slice(0, 10);

async function captureSite(browser, resource) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    locale: 'en-US',
  });
  const page = await context.newPage();
  try {
    await page.goto(resource.url, { waitUntil: 'load', timeout: 45_000 });
    // Some sites poll forever; the cap keeps them from blocking the run.
    await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_TIMEOUT }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await dismissOverlays(page);
    await page.waitForFunction(() => [...document.images]
      .filter(image => {
        const box = image.getBoundingClientRect();
        return box.bottom > 0 && box.top < innerHeight && box.width > 0;
      })
      .every(image => image.complete), null, { timeout: IMAGE_TIMEOUT }).catch(() => {});
    await page.waitForTimeout(SETTLE_MS);
    await dismissOverlays(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    return await page.screenshot({ type: 'png' });
  } finally {
    await context.close();
  }
}

async function captureGitHub(resource) {
  const [, owner, repo] = new URL(resource.url).pathname.split('/');
  // GitHub rate-limits this endpoint with a text body; a new cache key retries it.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(`https://opengraph.githubassets.com/${attempt}/${owner}/${repo}`);
    if (response.headers.get('content-type')?.startsWith('image/')) {
      const card = await sharp(Buffer.from(await response.arrayBuffer())).resize(WIDTH, 640).toBuffer();
      return sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#ffffff' } })
        .composite([{ input: card, top: 40, left: 0 }])
        .png()
        .toBuffer();
    }
    await new Promise(resolve => setTimeout(resolve, 2_000 * attempt));
  }
  throw new Error('GitHub social card download kept failing');
}

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const requested = process.argv.slice(2);
const targets = requested.length
  ? catalog.filter(resource => requested.includes(resource.id))
  : catalog.filter(resource => !SKIP_IN_FULL_RUN[resource.id]);
for (const [id, reason] of Object.entries(SKIP_IN_FULL_RUN)) {
  if (!requested.length) console.log(`skipped ${id}: ${reason}`);
}
const unknown = requested.filter(id => !catalog.some(resource => resource.id === id));
if (unknown.length) throw new Error(`Unknown resource ids: ${unknown.join(', ')}`);

const browser = await chromium.launch();
const captured = [];
const queue = [...targets];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  for (let resource = queue.shift(); resource; resource = queue.shift()) {
    try {
      const png = new URL(resource.url).hostname === 'github.com'
        ? await captureGitHub(resource)
        : await captureSite(browser, resource);
      await sharp(png).webp({ quality: 85 }).toFile(path.resolve('public', resource.screenshot.slice(1)));
      captured.push(resource.id);
      console.log(`captured ${resource.id}`);
    } catch (error) {
      console.error(`FAILED ${resource.id}: ${error.message}`);
    }
  }
}));
await browser.close();

// Edit only each captured entry's date so the file keeps its formatting.
let text = await readFile(catalogPath, 'utf8');
for (const id of captured) {
  const entry = new RegExp(`("id": "${id}"[\\s\\S]*?"screenshotCapturedDate": ")[\\d-]+(")`);
  text = text.replace(entry, `$1${today}$2`);
}
await writeFile(catalogPath, text);
console.log(`Captured ${captured.length} of ${targets.length}.`);
