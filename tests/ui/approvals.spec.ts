import { test, expect } from '../../fixtures/auth.fixture';
import { DashboardPage } from '../../pages/DashboardPage';

/** Bug #1 (Broken Access Control — UI half) from the audit. */
test.describe('Approvals UI', () => {
  test(
    'Approve/Reject controls should not be visible to Test Subject [KNOWN BUG]',
    { tag: ['@critical', '@ui', '@known-bug'] },
    async ({ testSubjectPage }) => {
      test.fail(
        true,
        'Known bug: the approval queue renders Approve/Reject for every role, including Test Subject, ' +
          'which is not an authorized approver (audit finding #1).'
      );

      const dashboardPage = new DashboardPage(testSubjectPage);
      await dashboardPage.gotoApprovalsQueue();

      await expect(dashboardPage.approveButtons()).toHaveCount(0);
      await expect(dashboardPage.rejectButtons()).toHaveCount(0);
    }
  );
});
