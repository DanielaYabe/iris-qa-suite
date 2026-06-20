import { test, expect } from '../../fixtures/auth.fixture';
import { SubjectsPage } from '../../pages/SubjectsPage';

/**
 * Bug #3 (row click never populates the detail panel) and Bug #4 (search
 * doesn't work by ID, and the Name column always renders blank) from the
 * audit. See tests/api/dashboard.spec.ts for the test.fail() convention.
 */
test.describe('Subjects UI', () => {
  test(
    'clicking a subject row should populate the detail panel [KNOWN BUG]',
    { tag: ['@high', '@ui', '@known-bug'] },
    async ({ testSubjectPage }) => {
      test.fail(
        true,
        'Known bug: the row\'s click target is an empty <button> (0x0 box, see Bug #4), so it can never ' +
          'actually be clicked — the detail panel stays on its placeholder text (audit finding #3).'
      );

      const subjectsPage = new SubjectsPage(testSubjectPage);
      await subjectsPage.goto();

      await subjectsPage.firstRowClickTarget().click();
      await expect(subjectsPage.detailPanelPlaceholder).not.toBeVisible();
    }
  );

  test(
    'the Name column should display each subject\'s name [KNOWN BUG]',
    { tag: ['@medium', '@ui', '@known-bug'] },
    async ({ testSubjectPage }) => {
      test.fail(true, 'Known bug: the Name column always renders empty, even though the API returns real names (audit finding #4).');

      const subjectsPage = new SubjectsPage(testSubjectPage);
      await subjectsPage.goto();

      const cellTexts = await subjectsPage.nameColumnCells().allInnerTexts();
      expect(cellTexts.some((text) => text.trim().length > 0)).toBe(true);
    }
  );

  test(
    'searching by subject ID should find the matching subject [KNOWN BUG]',
    { tag: ['@medium', '@ui', '@known-bug'] },
    async ({ testSubjectPage }) => {
      test.fail(true, 'Known bug: search only matches by name, so searching by ID (e.g. "S-0002") returns "No subjects." (audit finding #4).');

      const subjectsPage = new SubjectsPage(testSubjectPage);
      await subjectsPage.goto();

      const subjectId = await subjectsPage.firstRowSubjectId();
      await subjectsPage.search(subjectId);

      await expect(subjectsPage.noResultsMessage).not.toBeVisible();
      await expect(subjectsPage.rows).toHaveCount(1);
    }
  );

  test(
    'searching by internal name should find the matching subject [CORRECT BEHAVIOR]',
    { tag: ['@medium', '@ui', '@regression'] },
    async ({ testSubjectPage }) => {
      const subjectsPage = new SubjectsPage(testSubjectPage);
      await subjectsPage.goto();

      const subjects = await subjectsPage.lastFetchedSubjects();
      expect(subjects.length, 'Expected at least one existing subject in this case to search for').toBeGreaterThan(0);
      const target = subjects[0];

      await subjectsPage.search(target.name);

      await expect(subjectsPage.noResultsMessage).not.toBeVisible();
      await expect(subjectsPage.rows.first()).toContainText(target.id);
    }
  );
});
