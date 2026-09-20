import { expect, test } from '@playwright/test';

// Counts are derived from the page rather than hardcoded. The catalog gains entries
// often; asserting "37" would turn every content addition into a test failure, while
// internal consistency (chip count == visible cards == header total) is the real contract.

test.describe('resource topic hubs', () => {
  test('Mandarin topics use one approved cover and open their complete directories', async ({ page }) => {
    await page.goto('/resources');

    const design = page.getByRole('link').filter({ has: page.getByRole('heading', { name: '設計', exact: true }) });
    const security = page.getByRole('link').filter({ has: page.getByRole('heading', { name: 'AI 安全與漏洞工程' }) });

    await expect(design).toHaveAttribute('href', '/resources/design');
    await expect(design.locator('img')).toHaveCount(1);
    await expect(design.locator('img')).toHaveAttribute('src', /resource-topic-design.*\.svg/);
    await expect(design.locator('img')).toHaveAttribute('alt', '');

    await expect(security).toHaveAttribute('href', '/resources/security');
    await expect(security.locator('img')).toHaveCount(1);
    await expect(security.locator('img')).toHaveAttribute('src', /resource-topic-security.*\.svg/);
    await expect(security.locator('img')).toHaveAttribute('alt', '');

    await expect(page.getByText(/資料檢查至/)).toHaveCount(0);
  });

  test('English topics route to the localized directories without freshness metadata', async ({ page }) => {
    await page.goto('/en/resources');

    await expect(page.getByRole('link').filter({ has: page.getByRole('heading', { name: 'Design', exact: true }) })).toHaveAttribute('href', '/en/resources/design');
    await expect(page.getByRole('link').filter({ has: page.getByRole('heading', { name: 'AI security and vulnerability engineering' }) })).toHaveAttribute('href', '/en/resources/security');
    await expect(page.getByText(/Reviewed through/)).toHaveCount(0);
  });
});

test.describe('resource card destinations', () => {
  test('each visible resource is one external new-tab link', async ({ page }) => {
    await page.goto('/resources/security');

    const items = page.locator('[data-filter-item]:visible');
    for (const item of await items.all()) {
      const links = item.getByRole('link');
      await expect(links).toHaveCount(1);
      await expect(links).toHaveAttribute('target', '_blank');
      await expect(links).toHaveAttribute('rel', /noopener/);
      await expect(links).toHaveAttribute('rel', /noreferrer/);
      await expect(links).toHaveAttribute('aria-label', /另開新分頁/);
    }
  });
});

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
    await expect(page.locator('[data-resource-image]').first()).toBeVisible();

    await page.locator('[data-catalog-view-value="list"]').click();

    await expect(page.locator('html')).toHaveAttribute('data-catalog-view', 'list');
    await expect(page.locator('[data-resource-image]').first()).toBeHidden();
    await expect(page.locator('[data-catalog-view-value="list"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-catalog-view-value="grid"]')).toHaveAttribute('aria-pressed', 'false');
    // Cards themselves stay — list view removes the image, not the content.
    await expect(page.locator('[data-filter-item]:visible').first()).toBeVisible();

    await page.reload();

    // Set by the inline head guard, so it is already correct on first paint.
    await expect(page.locator('html')).toHaveAttribute('data-catalog-view', 'list');
    await expect(page.locator('[data-resource-image]').first()).toBeHidden();
    await expect(page.locator('[data-catalog-view-value="list"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('the preference carries across catalog pages', async ({ page }) => {
    await page.goto('/resources/design');
    await page.locator('[data-catalog-view-value="list"]').click();

    await page.goto('/en/resources/design');

    await expect(page.locator('html')).toHaveAttribute('data-catalog-view', 'list');
    await expect(page.locator('[data-resource-image]').first()).toBeHidden();
  });
});

test.describe('single-group catalog', () => {
  test('security page hides the chip row but keeps the view toggle', async ({ page }) => {
    await page.goto('/resources/security');

    await expect(page.locator('[data-catalog-controls]')).toBeVisible();
    await expect(page.locator('[data-filter-value]')).toHaveCount(0);
    await expect(page.locator('[data-catalog-view-value="list"]')).toBeVisible();

    await page.locator('[data-catalog-view-value="list"]').click();
    await expect(page.locator('[data-resource-image]').first()).toBeHidden();
  });
});

test.describe('localization', () => {
  test('zh catalog renders zh control labels', async ({ page }) => {
    await page.goto('/resources/design');

    await expect(page.locator('[data-filter-value="all"]')).toContainText('所有');
    await expect(page.locator('[data-catalog-view-value="list"]')).toContainText('列表');
  });
});
