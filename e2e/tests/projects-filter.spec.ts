import { expect, test } from '@playwright/test';

// Regression guard on the migration of both projects pages onto CatalogControls.
// Project tags overlap, so chips carry no counts and there is no group/section layer —
// this exercises the flat-catalog path through the same shared script.

for (const { name, path, allLabel, cardioDescription } of [
  {
    name: 'zh',
    path: '/projects',
    allLabel: '所有',
    cardioDescription: '以拉霸機概念設計的有氧訓練產生器，組合訓練重點、節奏、收尾、時間、暖身與緩和，快速建立多變的跑步機課表。',
  },
  {
    name: 'en',
    path: '/en/projects',
    allLabel: 'All',
    cardioDescription: 'A slot-machine-inspired workout generator that builds varied treadmill sessions by combining focus, pattern, finish, duration, warm-up, and cooldown options.',
  },
]) {
  test.describe(`projects tag filter (${name})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    test('renders a localized All chip and no view toggle', async ({ page }) => {
      await expect(page.locator('[data-filter-value="all"]')).toContainText(allLabel);
      // The project catalog intentionally keeps its card-only presentation.
      await expect(page.locator('[data-catalog-view-value]')).toHaveCount(0);
    });

    test('filtering by a tag shows only projects carrying it', async ({ page }) => {
      const total = await page.locator('[data-filter-item]').count();
      expect(total).toBeGreaterThan(0);

      const chip = page.locator('[data-filter-value]:not([data-filter-value="all"])').first();
      const tag = await chip.getAttribute('data-filter-value');
      await chip.click();

      const visible = page.locator('[data-filter-item]:visible');
      const shown = await visible.count();
      expect(shown).toBeGreaterThan(0);
      expect(shown).toBeLessThanOrEqual(total);

      for (const item of await visible.all()) {
        const tags = (await item.getAttribute('data-filter-values'))?.split(',') ?? [];
        expect(tags).toContain(tag);
      }

      await expect(page.locator('[data-filter-empty]')).toBeHidden();
    });

    test('All restores every project', async ({ page }) => {
      const total = await page.locator('[data-filter-item]').count();

      await page.locator('[data-filter-value]:not([data-filter-value="all"])').first().click();
      await page.locator('[data-filter-value="all"]').click();

      await expect(page.locator('[data-filter-item]:visible')).toHaveCount(total);
      await expect(page.locator('[data-filter-value="all"]')).toHaveAttribute('aria-pressed', 'true');
    });

    test('Cardio Slot opens its source and live workout generator', async ({ page }) => {
      const project = page.locator('[data-filter-item]').filter({ has: page.getByRole('heading', { name: 'Cardio Slot', exact: true }) });

      await expect(project).toContainText(cardioDescription);
      await expect(project.getByRole('img', { name: 'Cardio Slot' })).toBeVisible();
      await expect(project.getByRole('link', { name: /GitHub/ })).toHaveAttribute('href', 'https://github.com/ytchou/cardio-slot');
      await expect(project.getByRole('link', { name: /展示|Live/ })).toHaveAttribute('href', 'https://ytchou.github.io/cardio-slot/');
    });
  });
}

// Every rendered chip matches at least one project, so the empty state is unreachable
// through the UI. Drive the script directly to prove the branch still works.
test('empty state appears when nothing matches', async ({ page }) => {
  await page.goto('/projects');

  await page.evaluate(() => {
    const bar = document.querySelector('[data-catalog-controls]');
    const chip = bar?.querySelector('[data-filter-value]:not([data-filter-value="all"])');
    chip?.setAttribute('data-filter-value', '__no-such-tag__');
    (chip as HTMLElement | null)?.click();
  });

  await expect(page.locator('[data-filter-item]:visible')).toHaveCount(0);
  await expect(page.locator('[data-filter-empty]')).toBeVisible();
});
