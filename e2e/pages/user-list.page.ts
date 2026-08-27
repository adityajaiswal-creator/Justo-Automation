import { expect, type Locator, type Page } from '@playwright/test';

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

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText('User Management').first();
    this.search = page.getByPlaceholder('Search by Name, Phone');
    this.createButton = page.getByTestId('create-new-user-button');
    this.syncButton = page.getByTestId('sync-data-button');
    this.exportButton = page.getByTestId('export-all-users-button');
    this.emptyState = page.getByText('Team Collaboration Made Easy!');
    this.usersTab = page.getByText('Manage Users', { exact: true });
    this.teamsTab = page.getByText('Manage Teams', { exact: true });
    this.usersLink = page.getByTestId('users-link');
    this.manageColumns = page.getByRole('button', { name: /manage column/i });
  }

  async discardIfOpen() {
    const discard = this.page.getByRole('button', { name: /^discard$/i });
    if (await discard.isVisible().catch(() => false)) {
      await discard.click();
    }
  }

  async goto() {
    await this.page.goto('/user-management', { waitUntil: 'domcontentloaded' });
    await this.discardIfOpen();
    await expect(this.heading).toBeVisible({ timeout: 20000 });
  }

  async isEmpty() {
    return this.emptyState.isVisible().catch(() => false);
  }

  async hasTable() {
    return this.search.isVisible().catch(() => false);
  }

  async firstRowName() {
    const text = await this.page.locator('tbody tr').first().locator('td').first().innerText();
    return text.split('\n')[0].trim();
  }

  async searchFor(value: string) {
    await this.search.fill(value);
    await this.search.press('Enter');
    await expect(this.search).toHaveValue(value);
    await this.page.locator('tbody tr, [data-testid="user-list-table"]').first().waitFor({ timeout: 10000 }).catch(() => {});
  }

  async openRowMenu(searchText?: string) {
    if (searchText) await this.searchFor(searchText);
    const row = this.page.locator('tbody tr').first();
    await expect(row).toBeVisible({ timeout: 10000 });
    const actionsBtn = row.locator('td').last().getByRole('button').first();
    await actionsBtn.scrollIntoViewIfNeeded();
    await actionsBtn.click();
  }
}
