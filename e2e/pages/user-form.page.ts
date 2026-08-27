import { expect, type Locator, type Page } from '@playwright/test';
import { dismissDiscardDialog, isShowing, pressEscape } from '../helpers/dom';
import { gotoPath } from '../helpers/nav';

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
  readonly shift: Locator;
  readonly roles: Locator;

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
    this.shift = page.getByTestId('shift-select').or(page.getByRole('button', { name: /select a shift/i }));
    this.roles = page.getByRole('button', { name: /select roles/i });
  }

  primaryAction() {
    return this.page.getByRole('button', { name: /^(send invite|save|update)$/i }).last();
  }

  cancel() {
    return this.page.getByRole('button', { name: /^cancel$/i }).last();
  }

  async discardIfOpen() {
    await dismissDiscardDialog(this.page);
  }

  async gotoAdd() {
    await gotoPath(this.page, '/user-management/add-user');
    await this.discardIfOpen();
    await expect(this.title).toBeVisible({ timeout: 20000 });
  }

  async openDropdown(placeholder: string) {
    await pressEscape(this.page);
    const trigger = this.page.getByRole('button', { name: placeholder }).or(this.page.getByText(placeholder, { exact: true })).first();
    await expect(trigger).toBeVisible();
    await trigger.click();
  }

  async pickLoginMethod(label: string) {
    await this.openDropdown('Choose which login methods this user can use');
    const option = this.page.getByRole('option', { name: label }).first();
    await expect(option).toBeVisible();
    await option.click();
    await pressEscape(this.page);
  }

  async pickFirstRole() {
    await pressEscape(this.page);
    await expect(this.roles.first()).toBeVisible();
    await this.roles.first().click();
    const option = this.page.getByRole('option').first();
    await expect(option).toBeVisible({ timeout: 8000 });
    await option.click();
    await pressEscape(this.page);
  }

  async pickFirstShift() {
    await pressEscape(this.page);
    const trigger = this.shift.or(this.page.getByText('Select a shift', { exact: true })).first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    const item = this.page.getByRole('option').first().or(this.page.locator('[data-slot="select-item"]').first());
    await expect(item).toBeVisible({ timeout: 8000 });
    await item.click();
    await pressEscape(this.page);
  }

  async blurRolesWithoutPicking() {
    await pressEscape(this.page);
    await expect(this.roles.first()).toBeVisible();
    await this.roles.first().click();
    if (await isShowing(this.page.getByRole('option').first(), 3000)) {
      await pressEscape(this.page);
    }
  }

  async blurShiftWithoutPicking() {
    await pressEscape(this.page);
    const trigger = this.shift.or(this.page.getByText('Select a shift', { exact: true })).first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    if (await isShowing(this.page.getByRole('option').first().or(this.page.locator('[data-slot="select-item"]').first()), 3000)) {
      await pressEscape(this.page);
    }
  }
}
