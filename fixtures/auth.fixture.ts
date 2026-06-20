import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AuthClient } from '../api-clients/authClient';
import { DashboardClient } from '../api-clients/dashboardClient';
import { SessionsClient } from '../api-clients/sessionsClient';
import type { RoleKey } from '../config/env';

interface AuthFixtures {
  /** Page already logged in as Test Subject, on /admin. */
  testSubjectPage: Page;
  /** Page already logged in as Junior Test Coordinator, on /admin. */
  juniorCoordinatorPage: Page;
  authClient: AuthClient;
  dashboardClient: DashboardClient;
  sessionsClient: SessionsClient;
}

async function loginUiAs(page: Page, roleKey: RoleKey): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginAs(roleKey);
}

export const test = base.extend<AuthFixtures>({
  testSubjectPage: async ({ page }, use) => {
    await loginUiAs(page, 'testSubject');
    await use(page);
  },

  juniorCoordinatorPage: async ({ page }, use) => {
    await loginUiAs(page, 'juniorCoordinator');
    await use(page);
  },

  authClient: async ({ request }, use) => {
    await use(new AuthClient(request));
  },

  dashboardClient: async ({ request }, use) => {
    await use(new DashboardClient(request));
  },

  sessionsClient: async ({ request }, use) => {
    await use(new SessionsClient(request));
  },
});

export { expect } from '@playwright/test';
