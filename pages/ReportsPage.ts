import type { Page, Locator } from '@playwright/test';

/**
 * /admin/reports — Export CSV / Export PDF / Operator format. Also owns
 * navigation to /admin/audit, since the only thing this suite checks the
 * audit log for is "did a report-export action leave a trace" (bug #7).
 */
export class ReportsPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Reports / Export' });
  }

  async goto(): Promise<void> {
    await this.page.getByRole('link', { name: 'Reports' }).click();
    await this.heading.waitFor();
  }

  get exportCsvLink(): Locator {
    return this.page.getByRole('link', { name: 'Export CSV' });
  }

  get exportPdfButton(): Locator {
    return this.page.getByRole('button', { name: 'Export PDF' });
  }

  get operatorFormatButton(): Locator {
    return this.page.getByRole('button', { name: 'Operator format' });
  }

  async clickExportPdf(): Promise<void> {
    await this.exportPdfButton.click();
  }

  async clickOperatorFormat(): Promise<void> {
    await this.operatorFormatButton.click();
  }

  /**
   * Clicks Export PDF and reports whether it triggered any /api/ request.
   * Bounded wait is intentional here: proving an action did NOT fire a
   * network call has no positive DOM state to auto-wait on.
   */
  async clickExportPdfAndAwaitApiRequest(timeoutMs = 3000): Promise<boolean> {
    const sawRequest = this.page
      .waitForRequest((req) => req.url().includes('/api/'), { timeout: timeoutMs })
      .then(() => true)
      .catch(() => false);
    await this.clickExportPdf();
    return sawRequest;
  }

  /** Same as above, for the Operator format button. */
  async clickOperatorFormatAndAwaitApiRequest(timeoutMs = 3000): Promise<boolean> {
    const sawRequest = this.page
      .waitForRequest((req) => req.url().includes('/api/'), { timeout: timeoutMs })
      .then(() => true)
      .catch(() => false);
    await this.clickOperatorFormat();
    return sawRequest;
  }

  async gotoAuditLog(): Promise<void> {
    // Wait for the audit log's own data fetch, not just the heading —
    // otherwise a before/after text snapshot could race the entries loading.
    const responsePromise = this.page.waitForResponse((res) => res.url().includes('/admin/audit'));
    await this.page.getByRole('link', { name: 'Audit' }).click();
    await this.page.getByRole('heading', { name: 'Audit & incident log' }).waitFor();
    await responsePromise;
  }

  /** Full visible text of the audit log's main content, for before/after diffing. */
  async auditLogSnapshotText(): Promise<string> {
    return (await this.page.locator('main').innerText()).trim();
  }
}
