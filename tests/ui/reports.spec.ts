import { test, expect } from '../../fixtures/auth.fixture';
import { ReportsPage } from '../../pages/ReportsPage';

/** Bug #6 and Bug #7 (Functional bugs — dead export buttons) from the audit. */
test.describe('Reports UI', () => {
  test(
    'Export PDF should trigger a network request [KNOWN BUG]',
    { tag: ['@high', '@ui', '@known-bug'] },
    async ({ testSubjectPage }) => {
      test.fail(
        true,
        'Known bug: "Export PDF" has no onClick handler at all (confirmed in the bundle source) — ' +
          'clicking it does nothing observable (audit finding #6).'
      );

      const reportsPage = new ReportsPage(testSubjectPage);
      await reportsPage.goto();

      const sawRequest = await reportsPage.clickExportPdfAndAwaitApiRequest();
      expect(sawRequest).toBe(true);
    }
  );

  test(
    'Operator format should trigger a network request or leave an audit-log trace [KNOWN BUG]',
    { tag: ['@high', '@ui', '@known-bug'] },
    async ({ testSubjectPage }) => {
      test.fail(
        true,
        'Known bug: "Operator format" has no onClick handler at all (confirmed in the bundle source) — ' +
          'neither a request nor an audit entry appears, despite the UI claiming it "routes through ' +
          'the legacy export — see audit log if it errors" (audit finding #7).'
      );

      const reportsPage = new ReportsPage(testSubjectPage);
      await reportsPage.goto();

      await reportsPage.gotoAuditLog();
      const auditBefore = await reportsPage.auditLogSnapshotText();

      await reportsPage.goto();
      const sawRequest = await reportsPage.clickOperatorFormatAndAwaitApiRequest();

      await reportsPage.gotoAuditLog();
      const auditAfter = await reportsPage.auditLogSnapshotText();

      expect(sawRequest || auditAfter !== auditBefore).toBe(true);
    }
  );
});
