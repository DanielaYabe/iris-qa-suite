
import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Bug #1 (Broken Access Control) and Bug #2 (Data bug) from the audit.
 *
 * Both tests below assert the CORRECT/desired behavior and are marked
 * test.fail() — they are expected to FAIL today. The moment the underlying
 * bug is fixed, Playwright will report an "unexpected pass", which is the
 * signal to remove the test.fail() annotation.
 */
test.describe('Dashboard API', () => {
  test(
    'dashboard payload should be scoped per role, not identical institution-wide data for every role [KNOWN BUG]',
    { tag: ['@critical', '@api', '@known-bug'] },
    async ({ authClient, dashboardClient }) => {
      test.fail(true, 'Known bug: GET /admin/dashboard never checks role at all (audit finding #1).');

      await authClient.login('testSubject');
      const subjectView = await dashboardClient.getDashboard();

      await authClient.login('juniorCoordinator');
      const coordinatorView = await dashboardClient.getDashboard();

      expect(subjectView.body).not.toEqual(coordinatorView.body);
    }
  );

  test(
    'QE Index cutoff should fall within the current quarter, so sessions_counted reflects real session volume [KNOWN BUG]',
    { tag: ['@critical', '@api', '@known-bug'] },
    async ({ authClient, dashboardClient }) => {
      test.fail(
        true,
        'Known bug: cutoff is hardcoded to 1971-09-14, so only one legacy session is ever counted (audit finding #2).'
      );

      await authClient.login('testSubject');
      const { body } = await dashboardClient.getDashboard();

      const cutoff = new Date(body.cutoff);
      const now = new Date();
      const currentQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

      expect(cutoff.getTime()).toBeGreaterThanOrEqual(currentQuarterStart.getTime());
      expect(body.sessions_counted).toBeGreaterThan(1);
    }
  );
});
