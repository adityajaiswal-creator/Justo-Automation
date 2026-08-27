import { expect, type Locator, type Page } from '@playwright/test';
import { dismissDiscardDialog, isShowing, pressEscape } from '../helpers/dom';
import { ensurePath } from '../helpers/nav';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

export class ProjectFormPage {
  readonly page: Page;
  readonly title: Locator;
  readonly name: Locator;
  readonly code: Locator;
  readonly siteHead: Locator;
  readonly tagline: Locator;
  readonly back: Locator;
  readonly logo: Locator;
  readonly otp: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId('create-project-title');
    this.name = page.getByTestId('project-name-input');
    this.code = page.getByTestId('project-code-input');
    this.siteHead = page.getByTestId('site-head-email-input');
    this.tagline = page.getByTestId('project-tagline-input');
    this.back = page.getByTestId('cancel-project-button');
    this.logo = page.getByTestId('project-logo-upload');
    this.otp = page.getByTestId('project-is-otp-access-select');
  }

  create() {
    return this.page.getByTestId('create-project-button');
  }

  cancel() {
    return this.page.getByTestId('cancel-project-footer-button').or(this.page.getByRole('button', { name: /^cancel$/i }).last());
  }

  async discardIfOpen() {
    await dismissDiscardDialog(this.page);
  }

  async gotoCreate() {
    await ensurePath(this.page, '/projects-management/create');
    await this.discardIfOpen();
    await expect(this.title).toBeVisible({ timeout: 20000 });
    await expect(this.name).toBeVisible({ timeout: 15000 });
    await this.resetFields();
  }

  async resetFields() {
    await this.name.fill('');
    await this.code.fill('');
    if (await this.siteHead.isVisible()) await this.siteHead.fill('');
    if (await this.tagline.isVisible()) await this.tagline.fill('');
  }

  combobox(placeholder: string) {
    return this.page.getByRole('combobox', { name: placeholder }).or(this.page.getByRole('button', { name: placeholder })).first();
  }

  async pickCombobox(placeholder: string) {
    await pressEscape(this.page);
    const trigger = this.combobox(placeholder);
    await expect(trigger).toBeVisible({ timeout: 15000 });
    await trigger.click();
    const option = this.page.getByRole('option').first();
    await expect(option).toBeVisible({ timeout: 15000 });
    await option.click();
  }

  async fillGeo() {
    await this.pickCombobox('Select project location');
    await this.pickCombobox('Select city');
    await expect(this.combobox('Select zone')).toBeEnabled({ timeout: 15000 });
    await this.pickCombobox('Select zone');
    await expect(this.combobox('Select region')).toBeEnabled({ timeout: 15000 });
    await this.pickCombobox('Select region');
  }

  async fillRequired(name: string, code: string) {
    await this.name.fill(name);
    await this.code.fill(code);
    await this.fillGeo();
  }

  async submitCreate(method: 'POST' = 'POST') {
    const pending = this.page.waitForResponse((res) => {
      if (res.request().method() !== method) return false;
      const url = res.url().split('?')[0].replace(/\/$/, '');
      return url.endsWith('/projects');
    }, { timeout: 30000 });
    await expect(this.create()).toBeEnabled();
    await this.create().click();
    return pending;
  }

  async uploadLogo() {
    const input = this.logo.locator('input[type="file"]');
    await input.setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: TINY_PNG });
  }

  async addConfigRow() {
    await this.page.getByRole('button', { name: /add more/i }).click();
  }

  async configRowCount() {
    return this.page.getByText('Select Configuration', { exact: true }).count();
  }

  async isShowingUnsaved() {
    return isShowing(this.page.getByText('Unsaved Changes').first(), 3000);
  }
}
