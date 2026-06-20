import { test, expect } from '../../fixtures/auth.fixture';
import { SessionsPage } from '../../pages/SessionsPage';

/**
 * Bug #5 (Functional bug) end-to-end: drives the real 5-step wizard as
 * Junior Test Coordinator — the documented correct role for this workflow —
 * to confirm the documented "Schedule a test session" workflow is blocked.
 * See tests/api/sessions.spec.ts for the precise API-level reproduction.
 */
test.describe('Sessions UI', () => {
  test(
    'completing the New Session wizard should successfully create a session [KNOWN BUG]',
    { tag: ['@critical', '@ui', '@known-bug'] },
    async ({ juniorCoordinatorPage }) => {
      test.fail(
        true,
        'Known bug: the wizard never sends the backend-required "id" field, so submitting it 400s ' +
          'with {"detail":[{"type":"missing","loc":["body","id"],"msg":"Field required"}]} (audit finding #5).'
      );

      const sessionsPage = new SessionsPage(juniorCoordinatorPage);
      await sessionsPage.goto();

      const oneWeekOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const scheduledFor = oneWeekOut.toISOString().slice(0, 16);

      const { status } = await sessionsPage.completeWizardWithFirstAvailableOptions(scheduledFor);
      expect(status).toBeLessThan(300);
    }
  );
});
