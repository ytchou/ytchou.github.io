import { expect, test } from '@playwright/test';

test('Given a Mandarin visitor, when they browse the curated homepage, then each portfolio area leads to its focused destination', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Patrick C.' })).toBeVisible();
  await expect(page.getByText('Data Science, AI Workflows, and Product Analytics', { exact: true })).toBeVisible();
  await expect(page.getByText('台灣資料科學家，用數據打造有意義的事。', { exact: true })).toBeVisible();
  const main = page.getByRole('main');
  const email = main.getByRole('link', { name: 'Email', exact: true });
  await expect(email).toHaveAttribute('href', 'mailto:patrick.ytchou@gmail.com');
  await expect(email).not.toHaveAttribute('target', '_blank');
  for (const label of ['GitHub', 'LinkedIn']) {
    const link = main.getByRole('link', { name: label, exact: true });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener noreferrer/);
  }
  await expect(main.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/ytchou');
  await expect(main.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute('href', 'https://linkedin.com/in/ytchou');
  for (const label of ['文章', '專案', '資源']) {
    await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: '關於', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Toggle dark mode' })).toBeVisible();
  await expect(page.locator('#lang-toggle')).toBeVisible();
  const homeRows = page.locator('[data-post-row]');
  const homeCount = await homeRows.count();
  expect(homeCount).toBeGreaterThan(0);
  expect(homeCount).toBeLessThanOrEqual(3);
  await expect(homeRows.first().locator('.post-series')).toHaveText('系列鐵人賽');
  await expect(homeRows.first().locator('[data-post-title]')).toHaveText(/^Day \d+ \| .+/);

  await expect(page.getByRole('heading', { level: 2, name: '近期文章' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: '精選專案' })).toBeVisible();
  const hero = page.getByRole('heading', { level: 1, name: 'Patrick C.' }).locator('..');
  await expect(page.getByRole('heading', { level: 2, name: '一路走來' })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 2, name: '資源' })).toBeVisible();
  await expect(hero.getByRole('listitem').first()).toContainText('回到台灣，在 AI x 資料科學領域深耕與探索');
  await expect(page.getByRole('heading', { level: 3, name: 'Formoria' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Cardio Slot' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: '設計', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'AI 安全與漏洞工程' })).toBeVisible();
  const designTopic = page.getByRole('link').filter({ has: page.getByRole('heading', { level: 3, name: '設計', exact: true }) });
  const securityTopic = page.getByRole('link').filter({ has: page.getByRole('heading', { level: 3, name: 'AI 安全與漏洞工程' }) });
  await expect(designTopic).toHaveAttribute('href', '/resources/design');
  await expect(designTopic.locator('img')).toHaveCount(1);
  await expect(securityTopic).toHaveAttribute('href', '/resources/security');
  await expect(securityTopic.locator('img')).toHaveCount(1);
  await expect(page.getByRole('link', { name: '所有文章', exact: true })).toHaveAttribute('href', '/blog');
  await expect(page.getByRole('link', { name: '所有專案', exact: true })).toHaveAttribute('href', '/projects');
  await expect(page.getByRole('link', { name: '所有資源', exact: true })).toHaveAttribute('href', '/resources');
  await expect(page.getByRole('img', { name: 'Patrick C.' })).toHaveCount(0);

  const footer = page.getByRole('contentinfo');
  await expect(footer).toContainText(`© ${new Date().getFullYear()} Patrick C.`);
  await expect(footer.getByRole('link', { name: '聯絡', exact: true })).toHaveCount(0);
  const footerEmail = footer.getByRole('link', { name: 'Email', exact: true });
  await expect(footerEmail).toHaveAttribute('href', 'mailto:patrick.ytchou@gmail.com');
  await expect(footerEmail).not.toHaveAttribute('target', '_blank');
  const github = footer.getByRole('link', { name: 'GitHub', exact: true });
  await expect(github).toHaveAttribute('href', 'https://github.com/ytchou');
  await expect(github).toHaveAttribute('target', '_blank');
  await expect(github).toHaveAttribute('rel', /noopener/);
  const linkedin = footer.getByRole('link', { name: 'LinkedIn', exact: true });
  await expect(linkedin).toHaveAttribute('href', 'https://linkedin.com/in/ytchou');
  await expect(linkedin).toHaveAttribute('target', '_blank');
  await expect(linkedin).toHaveAttribute('rel', /noreferrer/);

  await page.setViewportSize({ width: 768, height: 1024 });
  const homeTitles = await homeRows.locator('[data-post-title]').allTextContents();
  await page.getByRole('link', { name: '文章', exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/?$/);
  const archiveRows = page.locator('[data-post-row]');
  expect(await archiveRows.count()).toBeGreaterThanOrEqual(homeCount);
  await expect(archiveRows.locator('[data-post-title]').first()).toHaveText(homeTitles[0]);

  await page.getByRole('link', { name: 'Patrick C.', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/about');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Patrick C.' })).toBeVisible();
});

test('Given an English visitor, when they browse the curated homepage, then Chinese fallback posts and localized destinations remain correct', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/en/');

  await expect(page.getByRole('heading', { level: 1, name: 'Patrick C.' })).toBeVisible();
  await expect(page.getByText('Data Science, AI Workflows, and Product Analytics', { exact: true })).toBeVisible();
  await expect(page.getByText('Data Scientist based in Taiwan. Building what matters.', { exact: true })).toBeVisible();
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: 'Email', exact: true })).toHaveAttribute('href', 'mailto:patrick.ytchou@gmail.com');
  await expect(main.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/ytchou');
  await expect(main.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute('href', 'https://linkedin.com/in/ytchou');
  await expect(page.getByRole('link', { name: 'About', exact: true })).toHaveCount(0);
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
  await expect(page.getByRole('heading', { level: 3, name: 'Cardio Slot' })).toBeVisible();
  const hero = page.getByRole('heading', { level: 1, name: 'Patrick C.' }).locator('..');
  await expect(page.getByRole('heading', { level: 2, name: 'My journey' })).toHaveCount(0);
  await expect(hero.getByRole('listitem').first()).toContainText('back in Taiwan — building and writing at the intersection of AI × data');
  await expect(page.getByRole('heading', { level: 3, name: 'Design' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'AI security and vulnerability engineering' })).toBeVisible();
  const designTopic = page.getByRole('link').filter({ has: page.getByRole('heading', { level: 3, name: 'Design' }) });
  const securityTopic = page.getByRole('link').filter({ has: page.getByRole('heading', { level: 3, name: 'AI security and vulnerability engineering' }) });
  await expect(designTopic).toHaveAttribute('href', '/en/resources/design');
  await expect(designTopic.locator('img')).toHaveCount(1);
  await expect(securityTopic).toHaveAttribute('href', '/en/resources/security');
  await expect(securityTopic.locator('img')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'All posts', exact: true })).toHaveAttribute('href', '/en/blog');
  await expect(page.getByRole('link', { name: 'All projects', exact: true })).toHaveAttribute('href', '/en/projects');
  await expect(page.getByRole('link', { name: 'All resources', exact: true })).toHaveAttribute('href', '/en/resources');

  const footer = page.getByRole('contentinfo');
  await expect(footer).toContainText(`© ${new Date().getFullYear()} Patrick C.`);
  await expect(footer.getByRole('link', { name: 'Contact', exact: true })).toHaveCount(0);
  await expect(footer.getByRole('link', { name: 'Email', exact: true })).toHaveAttribute('href', 'mailto:patrick.ytchou@gmail.com');
  await expect(footer.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/ytchou');
  await expect(footer.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute('href', 'https://linkedin.com/in/ytchou');

  await page.getByRole('link', { name: 'Writing', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/blog\/?$/);
  const archiveRows = page.locator('[data-post-row]');
  expect(await archiveRows.count()).toBeGreaterThanOrEqual(homeCount);
  await expect(archiveRows.getByText('中文', { exact: true })).toHaveCount(await archiveRows.count());

  await page.goto('/en/about');
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Patrick C.' })).toBeVisible();
});

test('Given a visitor exploring the portfolio, destination pages use Patrick’s voice without decorative eyebrow labels', async ({ page }) => {
  for (const destination of [
    { path: '/blog', heading: '我正在學的事', intro: '記錄我在資料科學、AI 工作流程與產品實作中的問題、選擇與心得。', eyebrow: '封存' },
    { path: '/en/blog', heading: 'What I’m learning', intro: 'Notes from my work in data science, AI workflows, and building products.', eyebrow: 'Archive' },
    { path: '/projects', heading: '我正在做的事', intro: '從資料產品到實用小工具，這些是我把想法做成可用產品的過程。', eyebrow: '作品集' },
    { path: '/en/projects', heading: 'What I’m building', intro: 'Data products and small tools I’ve made to turn ideas into something useful.', eyebrow: 'Portfolio' },
    { path: '/resources', heading: '我反覆使用的資源', intro: '做設計、研究 AI 安全與打造產品時，我真正會回頭使用的工具與參考。', eyebrow: '收藏' },
    { path: '/en/resources', heading: 'Tools I keep coming back to', intro: 'The sites, references, and open-source tools I rely on for design, AI security, and product work.', eyebrow: 'Directory' },
    { path: '/contact', heading: '來聊聊吧', intro: '有想法、問題，或想聊資料、AI 與產品？寫信給我。', eyebrow: '聯繫' },
    { path: '/en/contact', heading: 'Let’s talk', intro: 'Have an idea, a question, or want to talk about data, AI, or products? Send me a note.' },
    { path: '/resources/design', heading: '我的設計工具箱', intro: '做介面、品牌、字體與動態時，我會實際回訪的工具和參考。', eyebrow: '資源 / 主題 01' },
    { path: '/en/resources/design', heading: 'My design toolbox', intro: 'Tools and references I return to when working on interfaces, brands, typography, and motion.', eyebrow: 'Resources / Topic 01' },
    { path: '/resources/security', heading: '我如何探索 AI 安全', intro: '這些是我用來理解 AI 輔助安全稽核、找漏洞、修補與驗證的開源工具和方法。', eyebrow: '資源 / 主題 02' },
    { path: '/en/resources/security', heading: 'How I’m exploring AI security', intro: 'Open-source tools and methods I use to understand AI-assisted audits, vulnerability discovery, remediation, and verification.', eyebrow: 'Resources / Topic 02' },
  ]) {
    await page.goto(destination.path);
    await expect(page.getByRole('heading', { level: 1, name: destination.heading, exact: true })).toBeVisible();
    await expect(page.getByText(destination.intro, { exact: true })).toBeVisible();
    if (destination.eyebrow) {
      await expect(page.getByText(destination.eyebrow, { exact: true })).toHaveCount(0);
    }
  }

  await page.goto('/blog/tag/%E9%90%B5%E4%BA%BA%E8%B3%BD');
  await expect(page.getByRole('heading', { level: 1, name: '鐵人賽', exact: true })).toBeVisible();
  await expect(page.getByText(/這裡有我寫過的 \d+ 篇相關文章。/)).toBeVisible();
  await expect(page.getByText('標籤', { exact: true })).toHaveCount(0);

  await page.goto('/blog/day-01-why-this-series');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Day 1 | 挑戰用 30 天利用 Side Project 學習 AI Agents');
});
