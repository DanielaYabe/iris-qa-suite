import type { Page, Locator } from '@playwright/test';

/**
 * /admin — operator dashboard. Also owns the Pending-approvals queue, which
 * renders the identical widget on the dedicated /admin/approvals route, so
 * approvals.spec.ts uses this class via gotoApprovalsQueue() rather than a
 * separate ApprovalsPage class.
 */
export class DashboardPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Dashboard' });
  }

  async goto(): Promise<void> {
    await this.page.getByRole('link', { name: 'Dashboard' }).click();
    await this.heading.waitFor();
  }

  async gotoApprovalsQueue(): Promise<void> {
    // Wait for the queue's own data fetch, not just the heading — otherwise
    // a test could read the list before it has actually loaded any rows.
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('/admin/sessions') && res.url().includes('state=pending-approval')
    );
    await this.page.getByRole('link', { name: 'Approvals' }).click();
    await this.page.getByRole('heading', { name: 'Approval queue' }).waitFor();
    await responsePromise;
  }

  /** Matches every per-row "Approve session ..." button, regardless of which sessions are pending today. */
  approveButtons(): Locator {
    return this.page.getByRole('button', { name: /^Approve/ });
  }

  /** Matches every per-row "Reject session ..." button, regardless of which sessions are pending today. */
  rejectButtons(): Locator {
    return this.page.getByRole('button', { name: /^Reject/ });
  }
}
