import { expect, type Locator, type Page } from '@playwright/test';

export class UserFormPage {
  readonly page: Page;
  readonly title: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly phone: Locator;
  readonly password: Locator;
  readonly department: Locator;
  readonly designation: Locator;
  readonly back: Locator;
  readonly salutation: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId('user-add-edit-title');
    this.firstName = page.getByTestId('first-name-input');
    this.lastName = page.getByTestId('last-name-input');
    this.email = page.getByTestId('email-input');
    this.phone = page.getByPlaceholder('Enter phone number');
    this.password = page.getByTestId('password-input');
    this.department = page.getByTestId('department-input');
    this.designation = page.getByTestId('designation-input');
    this.back = page.getByTestId('go-back-button');
    this.salutation = page.getByTestId('salutation-radio-group');
  }

  primaryAction() {
    return this.page.getByRole('button', { name: /^(send invite|save|update)$/i }).last();
  }

  cancel() {
    return this.page.getByRole('button', { name: /^cancel$/i }).last();
  }

  async discardIfOpen() {
    const discard = this.page.getByRole('button', { name: /^discard$/i });
    if (await discard.isVisible().catch(() => false)) {
      await discard.click();
    }
  }

  async gotoAdd() {
    await this.page.goto('/user-management/add-user', { waitUntil: 'domcontentloaded' });
    await this.discardIfOpen();
    await expect(this.title).toBeVisible({ timeout: 20000 });
  }

  async openDropdown(placeholder: string) {
    await this.page.keyboard.press('Escape').catch(() => {});
    const trigger = this.page.getByText(placeholder, { exact: true }).first();
    if (await trigger.isVisible().catch(() => false)) {
      await trigger.click({ force: true });
      return;
    }
    await this.page.getByRole('button', { name: placeholder }).first().click({ force: true });
  }

  async pickLoginMethod(label: string) {
    await this.openDropdown('Choose which login methods this user can use');
    await this.page.getByRole('option', { name: label }).first().click({ force: true });
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  async pickFirstRole() {
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.locator('button').filter({ hasText: 'Select roles' }).first().click({ force: true });
    await expect(this.page.getByRole('option').first()).toBeVisible({ timeout: 8000 });
    await this.page.getByRole('option').first().click({ force: true });
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  async pickFirstShift() {
    await this.page.keyboard.press('Escape').catch(() => {});
    const exact = this.page.getByText('Select a shift', { exact: true });
    if (await exact.isVisible().catch(() => false)) {
      await exact.click({ force: true });
    } else {
      await this.page.getByText('Shift', { exact: true }).locator('xpath=following::button[1]').click({ force: true });
    }
    const item = this.page.locator('[data-slot="select-item"]').first();
    await expect(item).toBeVisible({ timeout: 8000 });
    await item.click({ force: true });
    await this.page.keyboard.press('Escape').catch(() => {});
  }
}
