import { expect, test } from '@playwright/test';

test('Given a Mandarin visitor, when they browse the curated homepage, then each portfolio area leads to its focused destination', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Patrick C.' })).toBeVisible();
  await expect(page.getByText('Data Science, AI Workflows, and Product Analytics', { exact: true })).toBeVisible();
  await expect(page.getByText('台灣資料科學家，用數據打造有意義的事。', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '關於我', exact: true })).toHaveAttribute('href', '/about');
  for (const label of ['文章', '專案', '資源', '關於']) {
    await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Toggle dark mode' })).toBeVisible();
  await expect(page.locator('#lang-toggle')).toBeVisible();
  const homeRows = page.locator('[data-post-row]');
  const homeCount = await homeRows.count();
  expect(homeCount).toBeGreaterThan(0);
  expect(homeCount).toBeLessThanOrEqual(3);

  await expect(page.getByRole('heading', { level: 2, name: '文章' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: '專案' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: '資源' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Formoria' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: '設計', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'AI 安全與漏洞工程' })).toBeVisible();
  await expect(page.getByRole('link', { name: '所有文章', exact: true })).toHaveAttribute('href', '/blog');
  await expect(page.getByRole('link', { name: '所有專案', exact: true })).toHaveAttribute('href', '/projects');
  await expect(page.getByRole('link', { name: '所有資源', exact: true })).toHaveAttribute('href', '/resources');
  await expect(page.getByRole('img', { name: 'Patrick C.' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '一路走來' })).toHaveCount(0);

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

test('Given an English visitor, when they browse the curated homepage, then Chinese fallback posts and localized destinations remain correct', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/en/');

  await expect(page.getByRole('heading', { level: 1, name: 'Patrick C.' })).toBeVisible();
  await expect(page.getByText('Data Science, AI Workflows, and Product Analytics', { exact: true })).toBeVisible();
  await expect(page.getByText('Data Scientist based in Taiwan. Building what matters.', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'About me', exact: true })).toHaveAttribute('href', '/en/about');
  const homeRows = page.locator('[data-post-row]');
  const homeCount = await homeRows.count();
  expect(homeCount).toBeGreaterThan(0);
  expect(homeCount).toBeLessThanOrEqual(3);
  for (const row of await homeRows.all()) {
    await expect(row).toHaveAttribute('data-post-source-lang', 'zh');
  }
  await expect(homeRows.getByText('中文', { exact: true })).toHaveCount(homeCount);

  const hrefs = await homeRows.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')));
  expect(hrefs.every(href => href?.startsWith('/blog/'))).toBe(true);
  expect(new Set(hrefs).size).toBe(hrefs.length);
  await expect(page.getByRole('heading', { level: 3, name: 'Formoria' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Design' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'AI security and vulnerability engineering' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'All posts', exact: true })).toHaveAttribute('href', '/en/blog');
  await expect(page.getByRole('link', { name: 'All projects', exact: true })).toHaveAttribute('href', '/en/projects');
  await expect(page.getByRole('link', { name: 'All resources', exact: true })).toHaveAttribute('href', '/en/resources');

  await page.getByRole('link', { name: 'Writing', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/blog\/?$/);
  const archiveRows = page.locator('[data-post-row]');
  expect(await archiveRows.count()).toBeGreaterThanOrEqual(homeCount);
  await expect(archiveRows.getByText('中文', { exact: true })).toHaveCount(await archiveRows.count());

  await expect(page.getByRole('link', { name: 'About', exact: true })).toHaveAttribute('href', '/en/about');
});
