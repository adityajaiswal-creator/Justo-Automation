import { expect, type Locator, type Page } from '@playwright/test';
import { dismissDiscardDialog } from '../helpers/dom';
import { gotoPath } from '../helpers/nav';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export class ShiftFormPage {
  readonly page: Page;
  readonly title: Locator;
  readonly name: Locator;
  readonly description: Locator;
  readonly back: Locator;
  readonly timezone: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId('user-add-edit-title');
    this.name = page.getByPlaceholder('Enter shift name');
    this.description = page.getByPlaceholder('Enter shift description');
    this.back = page.getByTestId('go-back-button');
    this.timezone = page.getByTestId('timezone-select').or(page.getByRole('combobox').filter({ hasText: /timezone|gmt|utc|asia/i }).first());
  }

  save() {
    return this.page.getByRole('button', { name: /^save$/i });
  }

  cancel() {
    return this.page.getByRole('button', { name: /^cancel$/i }).last();
  }

  async discardIfOpen() {
    await dismissDiscardDialog(this.page);
  }

  async gotoCreate() {
    await gotoPath(this.page, '/shift-management/create');
    await this.discardIfOpen();
    await expect(this.title).toBeVisible({ timeout: 20000 });
    await expect(this.dayRow('Mon').getByPlaceholder('9:00')).toBeVisible({ timeout: 15000 });
  }

  offBox(idx: number) {
    return this.page.locator(`#shift-timing-off-${idx}`);
  }

  dayRow(day: (typeof DAYS)[number] | number) {
    const idx = typeof day === 'number' ? day : DAYS.indexOf(day);
    return this.page.locator('tr').filter({ has: this.page.locator(`#shift-timing-off-${idx}`) });
  }

  async setPeriod(idx: number, which: 'start' | 'end', period: 'AM' | 'PM') {
    const row = this.dayRow(idx);
    const trigger = row.getByRole('combobox').nth(which === 'start' ? 0 : 1);
    const current = ((await trigger.innerText()) || '').trim();
    if (current === period) return;
    await trigger.click();
    const option = this.page.getByRole('option', { name: period, exact: true }).or(
      this.page.locator('[data-slot="select-item"]').filter({ hasText: new RegExp(`^${period}$`) }),
    );
    await expect(option.first()).toBeVisible({ timeout: 8000 });
    await option.first().click();
  }

  async saveShift(method: 'POST' | 'PUT') {
    const pending = this.page.waitForResponse(
      (res) => res.request().method() === method && res.url().includes('/shift'),
      { timeout: 30000 },
    );
    await expect(this.save()).toBeEnabled();
    await this.save().click();
    return pending;
  }
}
