import { expect, test } from '@playwright/test';

// Counts are derived from the page rather than hardcoded. The catalog gains entries
// often; asserting "37" would turn every content addition into a test failure, while
// internal consistency (chip count == visible cards == header total) is the real contract.

test.describe('resource catalog filter chips', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resources/design');
  });

  test('starts unfiltered with every group visible', async ({ page }) => {
    const cards = page.locator('[data-filter-item]');
    const total = await cards.count();

    await expect(page.locator('[data-filter-total]')).toHaveText(String(total));
    await expect(page.locator('[data-filter-value="all"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-filter-group]')).toHaveCount(
      await page.locator('[data-filter-group]:visible').count(),
    );
    await expect(page.locator('[data-filter-empty]')).toBeHidden();
  });

  test('selecting a group leaves only that group and updates counts', async ({ page }) => {
    const chip = page.locator('[data-filter-value]:not([data-filter-value="all"])').first();
    const group = await chip.getAttribute('data-filter-value');
    expect(group).toBeTruthy();

    await chip.click();

    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-filter-value="all"]')).toHaveAttribute('aria-pressed', 'false');

    // Exactly one section survives, and it is the one the chip names.
    const visibleGroups = page.locator('[data-filter-group]:visible');
    await expect(visibleGroups).toHaveCount(1);

    const visibleCards = page.locator('[data-filter-item]:visible');
    const shown = await visibleCards.count();
    expect(shown).toBeGreaterThan(0);
    for (const card of await visibleCards.all()) {
      expect(await card.getAttribute('data-filter-values')).toBe(group);
    }

    // The group's own NN badge and the header total both agree with what is rendered.
    await expect(visibleGroups.locator('[data-filter-count]')).toHaveText(
      String(shown).padStart(2, '0'),
    );
    await expect(page.locator('[data-filter-total]')).toHaveText(String(shown));
  });

  test('All restores the full catalog', async ({ page }) => {
    const total = await page.locator('[data-filter-item]').count();
    const groupCount = await page.locator('[data-filter-group]').count();

    await page.locator('[data-filter-value]:not([data-filter-value="all"])').first().click();
    await expect(page.locator('[data-filter-group]:visible')).toHaveCount(1);

    await page.locator('[data-filter-value="all"]').click();

    await expect(page.locator('[data-filter-item]:visible')).toHaveCount(total);
    await expect(page.locator('[data-filter-group]:visible')).toHaveCount(groupCount);
    await expect(page.locator('[data-filter-total]')).toHaveText(String(total));
  });
});

test.describe('grid / list view toggle', () => {
  test('list view hides screenshots and survives a reload', async ({ page }) => {
    await page.goto('/resources/design');

    await expect(page.locator('html')).toHaveAttribute('data-catalog-view', 'grid');
    await expect(page.locator('.resource-image-link').first()).toBeVisible();

    await page.locator('[data-catalog-view-value="list"]').click();

    await expect(page.locator('html')).toHaveAttribute('data-catalog-view', 'list');
    await expect(page.locator('.resource-image-link').first()).toBeHidden();
    await expect(page.locator('[data-catalog-view-value="list"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-catalog-view-value="grid"]')).toHaveAttribute('aria-pressed', 'false');
    // Cards themselves stay — list view removes the image, not the content.
    await expect(page.locator('[data-filter-item]:visible').first()).toBeVisible();

    await page.reload();

    // Set by the inline head guard, so it is already correct on first paint.
    await expect(page.locator('html')).toHaveAttribute('data-catalog-view', 'list');
    await expect(page.locator('.resource-image-link').first()).toBeHidden();
    await expect(page.locator('[data-catalog-view-value="list"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('the preference carries across catalog pages', async ({ page }) => {
    await page.goto('/resources/design');
    await page.locator('[data-catalog-view-value="list"]').click();

    await page.goto('/zh/resources/design');

    await expect(page.locator('html')).toHaveAttribute('data-catalog-view', 'list');
    await expect(page.locator('.resource-image-link').first()).toBeHidden();
  });
});

test.describe('single-group catalog', () => {
  test('security page hides the chip row but keeps the view toggle', async ({ page }) => {
    await page.goto('/resources/security');

    await expect(page.locator('[data-catalog-controls]')).toBeVisible();
    await expect(page.locator('[data-filter-value]')).toHaveCount(0);
    await expect(page.locator('[data-catalog-view-value="list"]')).toBeVisible();

    await page.locator('[data-catalog-view-value="list"]').click();
    await expect(page.locator('.resource-image-link').first()).toBeHidden();
  });
});

test.describe('localization', () => {
  test('zh catalog renders zh control labels', async ({ page }) => {
    await page.goto('/zh/resources/design');

    await expect(page.locator('[data-filter-value="all"]')).toContainText('所有');
    await expect(page.locator('[data-catalog-view-value="list"]')).toContainText('列表');
  });
});
