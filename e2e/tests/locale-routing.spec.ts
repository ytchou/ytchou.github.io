import { expect, test } from '@playwright/test';

test('Given a first-time visitor, when they open the portfolio and switch languages, then Mandarin owns the default URL', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
  await expect(page.locator('#lang-toggle')).toHaveText('English');
  await expect(page.locator('#lang-toggle')).toHaveAttribute('href', '/en/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://ytchou.github.io/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://ytchou.github.io/en/');
  await expect(page.locator('link[rel="alternate"][hreflang="zh-TW"]')).toHaveAttribute('href', 'https://ytchou.github.io/');
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', 'https://ytchou.github.io/');
  await expect(page.locator('link[type="application/rss+xml"]')).toHaveAttribute('href', 'https://ytchou.github.io/rss.xml');

  await page.locator('#lang-toggle').click();

  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#lang-toggle')).toHaveText('中文');
  await expect(page.locator('#lang-toggle')).toHaveAttribute('href', '/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://ytchou.github.io/en/');
  await expect(page.locator('link[rel="alternate"][hreflang="zh-TW"]')).toHaveAttribute('href', 'https://ytchou.github.io/');
  await expect(page.locator('link[type="application/rss+xml"]')).toHaveAttribute('href', 'https://ytchou.github.io/en/rss.xml');
});

test('Given an existing Mandarin article bookmark, when it opens, then it reaches the new canonical article without a broken English alternate', async ({ page }) => {
  await page.goto('/zh/blog/day-01-why-this-series');

  await expect(page).toHaveURL(/\/blog\/day-01-why-this-series\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Day 1');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://ytchou.github.io/blog/day-01-why-this-series/',
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    '用一個讓台灣小品牌更容易被找到的 Side Project，記錄 30 天學習 AI Agents 的問題、決策與實作。',
  );
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0);
  await expect(page.locator('#lang-toggle')).toHaveAttribute('href', '/en/blog');
});
