import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Runs before the api/ and ui/ projects (see playwright.config.ts
 * `dependencies`). If credentials or the environment are misconfigured,
 * this fails fast with a clear message instead of every other spec
 * failing one by one for the same root cause.
 */
test.describe('Smoke', () => {
  test(
    'Test Subject can log in and reach the dashboard',
    { tag: ['@smoke', '@ui'] },
    async ({ testSubjectPage }) => {
      const dashboardPage = new DashboardPage(testSubjectPage);
      await expect(
        dashboardPage.heading,
        'Login as Test Subject failed to reach /admin — check CASE_TOKEN and TEST_SUBJECT_PASSWORD in .env'
      ).toBeVisible();
    }
  );

  test(
    'Junior Test Coordinator can log in and reach the dashboard',
    { tag: ['@smoke', '@ui'] },
    async ({ juniorCoordinatorPage }) => {
      const dashboardPage = new DashboardPage(juniorCoordinatorPage);
      await expect(
        dashboardPage.heading,
        'Login as Junior Test Coordinator failed to reach /admin — check CASE_TOKEN and JUNIOR_COORDINATOR_PASSWORD in .env'
      ).toBeVisible();
    }
  );
});
