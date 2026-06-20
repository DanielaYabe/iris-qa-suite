import type { Page, Locator, Response } from '@playwright/test';

export interface WizardSubmitResult {
  status: number;
  body: unknown;
}

/** /admin/sessions — sessions table and the 5-step New Session wizard. */
export class SessionsPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Test sessions' });
  }

  async goto(): Promise<void> {
    await this.page.getByRole('link', { name: 'Sessions' }).click();
    await this.heading.waitFor();
  }

  get newSessionButton(): Locator {
    return this.page.getByRole('button', { name: 'New session' });
  }

  get subjectSelect(): Locator {
    return this.page.getByRole('combobox', { name: 'Subject' });
  }

  get chamberSelect(): Locator {
    return this.page.getByRole('combobox', { name: 'Chamber' });
  }

  get apparatusSelect(): Locator {
    return this.page.getByRole('combobox', { name: 'Apparatus' });
  }

  get scheduledForInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Scheduled for' });
  }

  get nextButton(): Locator {
    return this.page.getByRole('button', { name: 'Next' });
  }

  get cancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  get scheduleSessionButton(): Locator {
    return this.page.getByRole('button', { name: 'Schedule session' });
  }

  async startNewSessionWizard(): Promise<void> {
    await this.newSessionButton.click();
  }

  async clickNext(): Promise<void> {
    await this.nextButton.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async fillScheduledFor(value: string): Promise<void> {
    await this.scheduledForInput.fill(value);
  }

  /** Picks the first real (non-placeholder) option in a step's <select> and returns its value. */
  private async selectFirstAvailable(select: Locator): Promise<string> {
    await select.selectOption({ index: 1 });
    return select.inputValue();
  }

  async chooseFirstAvailableSubject(): Promise<string> {
    return this.selectFirstAvailable(this.subjectSelect);
  }

  async chooseFirstAvailableChamber(): Promise<string> {
    return this.selectFirstAvailable(this.chamberSelect);
  }

  async chooseFirstAvailableApparatus(): Promise<string> {
    return this.selectFirstAvailable(this.apparatusSelect);
  }

  /**
   * Drives the full Subject > Chamber > Apparatus > Schedule > Review wizard
   * with whichever options are first available (no hardcoded IDs) and submits.
   * This issues the real POST /admin/sessions call — see tests/ui/sessions.spec.ts
   * for why that is safe to run today.
   */
  async completeWizardWithFirstAvailableOptions(scheduledFor: string): Promise<WizardSubmitResult> {
    await this.startNewSessionWizard();
    await this.chooseFirstAvailableSubject();
    await this.clickNext();
    await this.chooseFirstAvailableChamber();
    await this.clickNext();
    await this.chooseFirstAvailableApparatus();
    await this.clickNext();
    await this.fillScheduledFor(scheduledFor);
    await this.clickNext();

    const [response] = await Promise.all([
      this.page.waitForResponse(
        (res: Response) => res.url().includes('/admin/sessions') && res.request().method() === 'POST'
      ),
      this.scheduleSessionButton.click(),
    ]);

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    return { status: response.status(), body };
  }
}
