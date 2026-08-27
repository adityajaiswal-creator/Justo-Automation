import { expect, type Locator, type Page } from '@playwright/test';
import { isShowing } from '../helpers/dom';

export class ProjectDetailsPage {
  readonly page: Page;
  readonly title: Locator;
  readonly back: Locator;
  readonly name: Locator;
  readonly code: Locator;
  readonly edit: Locator;
  readonly save: Locator;
  readonly cancel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId('create-project-title');
    this.back = page.getByTestId('cancel-project-button');
    this.name = page.getByTestId('project-name-input');
    this.code = page.getByTestId('project-code-input');
    this.edit = page.getByRole('button', { name: /^edit$/i });
    this.save = page.getByRole('button', { name: /^(save|saving\.\.\.)$/i }).last();
    this.cancel = page.getByRole('button', { name: /^cancel$/i }).last();
  }

  sidebar(label: string) {
    return this.page.getByText(label, { exact: true }).first();
  }

  async expectShell() {
    await expect(this.title).toBeVisible({ timeout: 20000 });
    await expect(this.back).toBeVisible();
  }

  async openSidebar(label: string) {
    const item = this.sidebar(label);
    await expect(item).toBeVisible({ timeout: 15000 });
    await item.click();
  }

  async startEdit() {
    await this.openSidebar('Project Information');
    await expect(this.edit).toBeVisible({ timeout: 15000 });
    await this.edit.click();
    await expect(this.name).toBeEnabled({ timeout: 8000 });
  }

  async saveEdit(method: 'PUT' | 'PATCH' = 'PUT') {
    const pending = this.page.waitForResponse(
      (res) => res.request().method() === method && /\/projects\/\d+/.test(res.url()),
      { timeout: 30000 },
    );
    await expect(this.save).toBeEnabled();
    await this.save.click();
    return pending;
  }

  async hasChecklist() {
    return isShowing(this.page.getByText(/getting started|setup summary|overall completion|setup progress|unable to load setup checklist/i).first(), 8000);
  }
}
