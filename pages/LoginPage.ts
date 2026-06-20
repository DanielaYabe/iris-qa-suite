import type { Page } from '@playwright/test';
import { env, type RoleKey } from '../config/env';

/** /login — Case Token + Role + Password staff login screen. */
export class LoginPage {
  constructor(private readonly page: Page) {}

  private get staffLoginLink() {
    return this.page.getByRole('link', { name: 'Staff login' });
  }

  private get caseTokenInput() {
    return this.page.getByRole('textbox', { name: 'Case Token' });
  }

  private get roleSelect() {
    return this.page.getByRole('combobox', { name: 'Role' });
  }

  private get passwordInput() {
    return this.page.getByRole('textbox', { name: 'Password' });
  }

  private get signInButton() {
    return this.page.getByRole('button', { name: 'Sign in' });
  }

  /**
   * Always start from "/" and click through to /login. The server has no
   * SPA fallback for deep routes, so a direct goto('/login') 404s.
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.staffLoginLink.click();
  }

  async loginAs(roleKey: RoleKey): Promise<void> {
    const role = env.roles[roleKey];
    await this.caseTokenInput.fill(env.caseToken);
    await this.roleSelect.selectOption({ label: role.label });
    await this.passwordInput.fill(role.password);
    await this.signInButton.click();
    await this.page.waitForURL('**/admin');
  }
}
