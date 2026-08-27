import { expect, type Locator, type Page } from '@playwright/test';
import { dismissDiscardDialog, isShowing } from '../helpers/dom';
import { ensurePath } from '../helpers/nav';

export class ProjectListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly search: Locator;
  readonly createButton: Locator;
  readonly emptyState: Locator;
  readonly manageColumns: Locator;
  readonly filters: Locator;
  readonly table: Locator;
  readonly projectsLink: Locator;
  readonly total: Locator;
  readonly pageRoot: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageRoot = page.getByTestId('project-management-page');
    this.heading = page.getByText('Project Management', { exact: true }).first();
    this.search = page.getByPlaceholder('Search by Project Code or Project Name');
    this.createButton = page.getByTestId('create-new-project-button');
    this.emptyState = page.getByText('No Projects added yet');
    this.manageColumns = page.getByRole('button', { name: /manage column/i });
    this.filters = page.getByRole('button', { name: /^filters/i });
    this.table = page.getByTestId('project-list').or(page.locator('tbody'));
    this.projectsLink = page.getByTestId('projects-link');
    this.total = page.getByText(/total projects/i);
  }

  async goto() {
    await ensurePath(this.page, '/projects-management');
    await dismissDiscardDialog(this.page);
    await expect(this.pageRoot.or(this.heading).or(this.emptyState).first()).toBeVisible({ timeout: 20000 });
  }

  async isEmpty() {
    return isShowing(this.emptyState, 1500);
  }

  async hasTable() {
    return isShowing(this.search, 2500);
  }

  row(text?: string) {
    const rows = this.page.locator('tbody tr');
    return text ? rows.filter({ hasText: text }).first() : rows.first();
  }

  async firstRowName() {
    const text = await this.row().locator('td').nth(1).innerText();
    return text.split('\n')[0].trim();
  }

  async firstRowCode() {
    const text = await this.row().locator('td').first().innerText();
    return text.split('\n')[0].trim();
  }

  async searchFor(value: string) {
    await this.search.fill(value);
    await this.search.press('Enter');
    await expect(this.search).toHaveValue(value);
  }

  async openDetails(text?: string) {
    if (text) {
      await this.searchFor(text);
      await expect(this.row(text)).toBeVisible({ timeout: 15000 });
      await this.row(text).click();
    } else {
      await expect(this.row()).toBeVisible({ timeout: 15000 });
      await this.row().click();
    }
    await expect(this.page).toHaveURL(/\/projects-management\/details/, { timeout: 20000 });
  }

  async toggleStatus(name: string) {
    await this.searchFor(name);
    const row = this.row(name);
    await expect(row).toBeVisible({ timeout: 15000 });
    const toggle = row.locator('#switch-button button, #switch-button [role="switch"]').first();
    await toggle.click();
    await expect(this.page.getByText('Confirm Status Change').first()).toBeVisible({ timeout: 8000 });
  }
}
