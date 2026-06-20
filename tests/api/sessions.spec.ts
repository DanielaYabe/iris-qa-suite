import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Bug #1 (Broken Access Control — list scope, and the correctly-protected
 * approve endpoint) and Bug #5 (Functional bug — session creation 400) from
 * the audit. See tests/api/dashboard.spec.ts for the test.fail() convention
 * used for known-bug tests below.
 */
test.describe('Sessions API', () => {
  test(
    'sessions list should be scoped per role, not identical institution-wide data for every role [KNOWN BUG]',
    { tag: ['@critical', '@api', '@known-bug'] },
    async ({ authClient, sessionsClient }) => {
      test.fail(true, 'Known bug: GET /admin/sessions never checks role at all (audit finding #1).');

      await authClient.login('testSubject');
      const subjectView = await sessionsClient.list();

      await authClient.login('juniorCoordinator');
      const coordinatorView = await sessionsClient.list();

      expect(subjectView.body).not.toEqual(coordinatorView.body);
    }
  );

  test(
    'approving a session as Test Subject must continue returning a permission error [CORRECT BEHAVIOR]',
    { tag: ['@critical', '@api', '@regression'] },
    async ({ authClient, sessionsClient }) => {
      // Authenticate before the unscoped list call — GET isn't role-scoped
      // (that's bug #1), but every admin endpoint still requires an active
      // login session for this context.
      await authClient.login('juniorCoordinator');

      // Any existing session id works: the role check is expected to
      // short-circuit before any session-state validation runs.
      const { body: anySessions } = await sessionsClient.list();
      expect(anySessions.length, 'Expected at least one existing session in this case to reference').toBeGreaterThan(0);
      const sessionId = anySessions[0].id;

      await authClient.login('testSubject');
      const { status, body } = await sessionsClient.approve(sessionId);

      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(500);
      expect(JSON.stringify(body)).toMatch(/requires role/i);
    }
  );

  test(
    'creating a session via the documented wizard payload should succeed [KNOWN BUG]',
    { tag: ['@critical', '@api', '@known-bug'] },
    async ({ authClient, sessionsClient }) => {
      test.fail(
        true,
        'Known bug: the frontend never sends the backend-required "id" field, so this 400s with ' +
          '{"detail":[{"type":"missing","loc":["body","id"],"msg":"Field required"}]} (audit finding #5).'
      );

      await authClient.login('juniorCoordinator');

      const { body: existing } = await sessionsClient.list();
      expect(existing.length, 'Expected at least one existing session to source subject/chamber ids from').toBeGreaterThan(0);
      const reference = existing[0];

      const { status } = await sessionsClient.create({
        subject_id: reference.subject_id,
        chamber_id: reference.chamber_id,
        // "AP-001" is known to exist in this case's test data at time of
        // writing. Even if it didn't, the missing-"id" validation error this
        // test targets fires before any apparatus lookup.
        apparatus_id: 'AP-001',
        scheduled_for: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(status).toBeLessThan(300);
    }
  );
});
