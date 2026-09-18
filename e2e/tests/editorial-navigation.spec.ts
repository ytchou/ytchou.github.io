import { expect, test } from '@playwright/test';

test('Given a Mandarin visitor, when they browse the editorial homepage, then writing leads to the full archive and About owns the profile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  await expect(page.getByText('寫資料科學、AI 工作流程與產品思考。', { exact: true })).toBeVisible();
  for (const label of ['文章', '專案', '資源', '關於']) {
    await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Toggle dark mode' })).toBeVisible();
  await expect(page.locator('#lang-toggle')).toBeVisible();
  const homeRows = page.locator('[data-post-row]');
  const homeCount = await homeRows.count();
  expect(homeCount).toBeGreaterThan(0);
  expect(homeCount).toBeLessThanOrEqual(5);

  await expect(page.getByRole('heading', { name: '一路走來' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '作品選輯' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '精選資源' })).toHaveCount(0);

  await page.setViewportSize({ width: 768, height: 1024 });
  const homeTitles = await homeRows.locator('[data-post-title]').allTextContents();
  await page.getByRole('link', { name: '文章', exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/?$/);
  const archiveRows = page.locator('[data-post-row]');
  expect(await archiveRows.count()).toBeGreaterThanOrEqual(homeCount);
  await expect(archiveRows.locator('[data-post-title]').first()).toHaveText(homeTitles[0]);

  await page.getByRole('link', { name: 'Patrick C.', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('link', { name: '關於', exact: true }).click();
  await expect(page).toHaveURL(/\/about\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: '關於' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Patrick C.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '一路走來' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Email' })).toBeVisible();
});

test('Given an English visitor, when posts have no English edition, then the feeds show one marked Chinese fallback per slug', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/en/');

  await expect(page.getByText('Writing about data science, AI workflows, and product thinking.', { exact: true })).toBeVisible();
  const homeRows = page.locator('[data-post-row]');
  const homeCount = await homeRows.count();
  expect(homeCount).toBeGreaterThan(0);
  expect(homeCount).toBeLessThanOrEqual(5);
  for (const row of await homeRows.all()) {
    await expect(row).toHaveAttribute('data-post-source-lang', 'zh');
  }
  await expect(homeRows.getByText('中文', { exact: true })).toHaveCount(homeCount);

  const hrefs = await homeRows.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')));
  expect(hrefs.every(href => href?.startsWith('/blog/'))).toBe(true);
  expect(new Set(hrefs).size).toBe(hrefs.length);

  await page.getByRole('link', { name: 'Writing', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/blog\/?$/);
  const archiveRows = page.locator('[data-post-row]');
  expect(await archiveRows.count()).toBeGreaterThanOrEqual(homeCount);
  await expect(archiveRows.getByText('中文', { exact: true })).toHaveCount(await archiveRows.count());

  await expect(page.getByRole('link', { name: 'About', exact: true })).toHaveAttribute('href', '/en/about');
});
