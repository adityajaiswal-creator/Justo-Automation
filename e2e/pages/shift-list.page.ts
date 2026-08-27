import { expect, type Locator, type Page } from '@playwright/test';
import { dismissDiscardDialog, isShowing } from '../helpers/dom';
import { gotoPath } from '../helpers/nav';

export class ShiftListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly search: Locator;
  readonly createButton: Locator;
  readonly emptyState: Locator;
  readonly manageColumns: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText('Shifts Management').or(page.getByRole('heading', { name: /shift/i })).first();
    this.search = page.getByPlaceholder('Search by Shift Name');
    this.createButton = page.getByTestId('create-new-project-button').or(page.getByRole('button', { name: 'Create Shift' }));
    this.emptyState = page.getByText('No shifts added yet');
    this.manageColumns = page.getByRole('button', { name: /manage column/i });
    this.table = page.locator('table').last();
  }

  async goto() {
    await gotoPath(this.page, '/shift-management');
    await dismissDiscardDialog(this.page);
    await expect(this.heading).toBeVisible({ timeout: 20000 });
  }

  async isEmpty() {
    return isShowing(this.emptyState, 1500);
  }

  async hasTable() {
    return isShowing(this.search, 1500);
  }

  row(text?: string) {
    const rows = this.page.locator('tbody tr');
    return text ? rows.filter({ hasText: text }).first() : rows.first();
  }

  async firstRowName() {
    const text = await this.row().locator('td').first().innerText();
    return text.split('\n')[0].trim();
  }

  async searchFor(value: string) {
    await this.search.fill(value);
    await this.search.press('Enter');
    await expect(this.search).toHaveValue(value);
  }

  async openRowMenu(name: string) {
    await this.searchFor(name);
    const row = this.row(name);
    await expect(row).toBeVisible({ timeout: 10000 });
    const actionsBtn = row.locator('td').last().getByRole('button').first();
    await actionsBtn.scrollIntoViewIfNeeded();
    await actionsBtn.click();
    await expect(this.page.getByText('Edit', { exact: true }).or(this.page.getByText('Clone', { exact: true })).last()).toBeVisible();
  }

  async clickMenu(name: string) {
    const item = this.page.getByRole('menuitem', { name, exact: true }).or(this.page.getByRole('button', { name, exact: true })).last();
    await expect(item).toBeVisible();
    await item.click();
  }

  async removeShift(name: string) {
    await this.openRowMenu(name);
    await this.clickMenu('Remove');
    const confirm = this.page.getByRole('button', { name: /yes, i'm sure/i });
    if (!(await isShowing(confirm, 4000))) return false;
    const del = this.page.waitForResponse(
      (res) => res.request().method() === 'DELETE' && res.url().includes('/shift'),
      { timeout: 20000 },
    );
    await confirm.click();
    const res = await del;
    return res.ok();
  }
}
