import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

/**
 * Login sets a per-context, HttpOnly session cookie (iris_role_session) —
 * each test's own browser/API context gets an independent session, so
 * role-sensitive tests don't interfere with each other even when running
 * concurrently. fullyParallel stays at Playwright's default (true).
 */
export default defineConfig({
  testDir: './tests',
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      // Logs in as each role and confirms the dashboard loads. Runs first;
      // if credentials/environment are misconfigured, it fails fast and the
      // api/ui projects below are skipped instead of failing noisily one by one.
      name: 'smoke',
      testMatch: /smoke\.spec\.ts/,
      use: { baseURL: env.baseUrl, ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: './tests/api',
      dependencies: ['smoke'],
      use: { baseURL: env.apiBaseUrl },
    },
    {
      name: 'ui',
      testDir: './tests/ui',
      dependencies: ['smoke'],
      use: { baseURL: env.baseUrl, ...devices['Desktop Chrome'] },
    },
  ],
});
