import { expect, type Locator, type Page } from '@playwright/test';
import { dismissDiscardDialog, isShowing } from '../helpers/dom';
import { gotoPath } from '../helpers/nav';

export class UserListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly search: Locator;
  readonly createButton: Locator;
  readonly syncButton: Locator;
  readonly exportButton: Locator;
  readonly emptyState: Locator;
  readonly usersTab: Locator;
  readonly teamsTab: Locator;
  readonly usersLink: Locator;
  readonly manageColumns: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText('User Management', { exact: true }).first();
    this.search = page.getByPlaceholder('Search by Name, Phone');
    this.createButton = page.getByTestId('create-new-user-button');
    this.syncButton = page.getByTestId('sync-data-button');
    this.exportButton = page.getByTestId('export-all-users-button');
    this.emptyState = page.getByText('Team Collaboration Made Easy!');
    this.usersTab = page.getByText('Manage Users', { exact: true });
    this.teamsTab = page.getByText('Manage Teams', { exact: true });
    this.usersLink = page.getByTestId('users-link');
    this.manageColumns = page.getByRole('button', { name: /manage column/i });
    this.table = page.getByTestId('user-list-table').or(page.locator('tbody'));
  }

  async goto() {
    await gotoPath(this.page, '/user-management');
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
    await expect(this.table.first()).toBeVisible({ timeout: 10000 });
  }

  async openRowMenu(searchText?: string) {
    if (searchText) {
      await this.openRowContaining(searchText);
      return;
    }
    await this.openRowActions(this.row());
  }

  async openRowContaining(text: string) {
    let match = this.row(text);
    if (!(await isShowing(match, 1500))) {
      await this.searchFor(text);
      match = this.row(text);
    }
    await this.openRowActions(match);
  }

  private async openRowActions(row: Locator) {
    await expect(row).toBeVisible({ timeout: 10000 });
    const actionsBtn = row.locator('td').last().getByRole('button').first();
    await actionsBtn.scrollIntoViewIfNeeded();
    await actionsBtn.click();
  }

  async deactivateRow(name: string) {
    await this.searchFor(name);
    const statusSwitch = this.row(name).getByRole('switch');
    if (!(await isShowing(statusSwitch, 3000)) || !(await statusSwitch.isEnabled())) {
      return false;
    }
    await statusSwitch.click();
    const confirm = this.page.getByRole('button', { name: /confirm/i });
    if (await isShowing(confirm, 4000)) {
      await confirm.click();
    }
    return true;
  }
}
