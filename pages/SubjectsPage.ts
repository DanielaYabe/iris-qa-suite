import type { Page, Locator, Response } from '@playwright/test';

export interface SubjectRecord {
  id: string;
  name: string;
  intake_date: string;
  status: string;
  eligibility_flags: string;
  current_wing: string;
}

/** /admin/subjects — subjects table, search box, and detail panel. */
export class SubjectsPage {
  private lastSubjectsResponse?: Response;

  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Subjects' });
  }

  async goto(): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('/admin/subjects') && res.request().method() === 'GET'
    );
    await this.page.getByRole('link', { name: 'Subjects' }).click();
    await this.heading.waitFor();
    this.lastSubjectsResponse = await responsePromise;
  }

  /**
   * The raw API payload backing the table on initial load. The UI's Name
   * column always renders blank (bug #4), but the API does return real
   * names — this lets tests pick a real, dynamically-discovered name
   * instead of hardcoding one.
   */
  async lastFetchedSubjects(): Promise<SubjectRecord[]> {
    if (!this.lastSubjectsResponse) {
      throw new Error('No subjects response captured yet — call goto() first');
    }
    return this.lastSubjectsResponse.json();
  }

  get searchBox(): Locator {
    return this.page.getByRole('searchbox', { name: 'Search by name…' });
  }

  get table(): Locator {
    return this.page.getByRole('table', { name: 'Subjects list' });
  }

  get rows(): Locator {
    return this.table.locator('tbody tr');
  }

  get noResultsMessage(): Locator {
    return this.page.getByText('No subjects.');
  }

  get detailPanelPlaceholder(): Locator {
    return this.page.getByText('Select a subject for detail.');
  }

  async search(term: string): Promise<void> {
    await this.searchBox.fill(term);
  }

  async clearSearch(): Promise<void> {
    await this.searchBox.fill('');
  }

  async rowCount(): Promise<number> {
    return this.rows.count();
  }

  /** Subject-ID cell (column 1) text of the first rendered row, e.g. "S-0001". */
  async firstRowSubjectId(): Promise<string> {
    const text = await this.rows.first().locator('td').first().innerText();
    return text.trim();
  }

  /**
   * The row's real click target: a button in the Name column. It currently
   * renders empty (bug #4), which collapses it to a 0x0 box — so a normal
   * click can never hit it (bug #3). See tests/ui/subjects.spec.ts.
   */
  firstRowClickTarget(): Locator {
    return this.rows.first().locator('td:nth-child(2) button');
  }

  /** All Name-column cells, used to assert whether they render any text (bug #4). */
  nameColumnCells(): Locator {
    return this.table.locator('tbody tr td:nth-child(2)');
  }
}
