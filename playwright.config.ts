import { defineConfig, devices } from '@playwright/test';

// 4322, not Astro's default 4321: a dev server is often already running on 4321, and
// with reuseExistingServer that would silently test dev bundling instead of a build.
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4322);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --ignore-lock`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
