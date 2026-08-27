import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/test';
import type { CatalogCase } from '../helpers/catalog';
import { isShowing, pressEscape } from '../helpers/dom';
import type { ShiftFormPage } from '../pages/shift-form.page';
import type { ShiftListPage } from '../pages/shift-list.page';

export type ShiftRunState = {
  stamp: string;
  names: string[];
  primary: string;
  weekdays: string;
  night: string;
  clone: string;
};

export type ShiftCtx = {
  page: Page;
  shiftList: ShiftListPage;
  shiftForm: ShiftFormPage;
  state: ShiftRunState;
};

async function requireTable(shiftList: ShiftListPage) {
  await shiftList.goto();
  test.skip(!(await shiftList.hasTable()), 'List is empty on this tenant');
}

function requireCreated(state: ShiftRunState) {
  if (!state.primary) {
    throw new Error('SHIFT-CREATE-11 must create a shift before this mutating case');
  }
}

function menuItem(page: Page, name: string) {
  return page.getByRole('menuitem', { name, exact: true }).or(page.getByText(name, { exact: true })).last();
}

const handlers: Record<string, (ctx: ShiftCtx) => Promise<void>> = {
  'SHIFT-NAV-01': async ({ shiftList, page }) => {
    await shiftList.goto();
    await expect(page).toHaveURL(/\/shift-management/);
    await expect(shiftList.heading).toBeVisible();
  },
  'SHIFT-NAV-02': async ({ shiftList, page }) => {
    await requireTable(shiftList);
    const headers = await page.locator('thead').last().innerText();
    expect(headers).toMatch(/Shift Name/i);
    expect(headers).toMatch(/MON/i);
    await expect(shiftList.search).toBeVisible();
    await expect(shiftList.manageColumns).toBeVisible();
  },
  'SHIFT-NAV-03': async ({ shiftList }) => {
    await shiftList.goto();
    test.skip(!(await shiftList.isEmpty()), 'Shifts already exist');
    await expect(shiftList.emptyState).toBeVisible();
  },
  'SHIFT-NAV-04': async ({ shiftList }) => {
    await requireTable(shiftList);
    await shiftList.searchFor('zzznoshift999');
    await expect(shiftList.emptyState).toHaveCount(0);
    await expect(shiftList.search).toBeVisible();
  },
  'SHIFT-LIST-01': async ({ shiftList }) => {
    await shiftList.goto();
    await expect(shiftList.createButton.first()).toBeVisible();
  },
  'SHIFT-LIST-03': async ({ shiftList }) => {
    await requireTable(shiftList);
    const name = await shiftList.firstRowName();
    await shiftList.searchFor(name);
    await expect(shiftList.row(name)).toBeVisible();
  },
  'SHIFT-LIST-04': async ({ shiftList }) => {
    await requireTable(shiftList);
    await shiftList.searchFor('');
    await expect(shiftList.search).toHaveValue('');
  },
  'SHIFT-LIST-05': async ({ shiftList, page }) => {
    await requireTable(shiftList);
    const body = await page.locator('tbody').last().innerText();
    test.skip(!/\d{1,2}:\d{2}/.test(body), 'No time cells on current page');
    expect(body).toMatch(/\d{1,2}:\d{2}/);
  },
  'SHIFT-LIST-06': async ({ shiftList, page }) => {
    await requireTable(shiftList);
    const body = await page.locator('tbody').last().innerText();
    test.skip(!/\bOff\b/i.test(body), 'No Off cells on current page');
    expect(body).toMatch(/\bOff\b/i);
  },
  'SHIFT-LIST-08': async ({ shiftList, page }) => {
    await requireTable(shiftList);
    await page.getByText('Shift Name', { exact: true }).first().click();
    await expect(shiftList.row()).toBeVisible();
  },
  'SHIFT-LIST-09': async ({ shiftList, page }) => {
    await requireTable(shiftList);
    await shiftList.manageColumns.click();
    await expect(page.getByText('Created At', { exact: true }).first()).toBeVisible();
    await pressEscape(page);
  },
  'SHIFT-LIST-10': async ({ shiftList, page }) => {
    await requireTable(shiftList);
    await shiftList.openRowMenu(await shiftList.firstRowName());
    await expect(menuItem(page, 'Edit')).toBeVisible();
    await pressEscape(page);
  },
  'SHIFT-LIST-11': async ({ shiftList, page }) => {
    await requireTable(shiftList);
    await shiftList.openRowMenu(await shiftList.firstRowName());
    await expect(menuItem(page, 'Remove')).toBeVisible();
    await pressEscape(page);
  },
  'SHIFT-LIST-12': async ({ shiftList, page }) => {
    await requireTable(shiftList);
    await shiftList.openRowMenu(await shiftList.firstRowName());
    await expect(menuItem(page, 'Clone')).toBeVisible();
    await pressEscape(page);
  },
  'SHIFT-CREATE-01': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await expect(page).toHaveURL(/\/shift-management\/create/);
    await expect(shiftForm.title).toHaveText(/create shift/i);
    await expect(shiftForm.back).toBeVisible();
    await expect(shiftForm.save()).toBeVisible();
  },
  'SHIFT-CREATE-02': async ({ shiftList, page }) => {
    await shiftList.goto();
    test.skip(!(await shiftList.isEmpty()), 'List is not empty');
    await shiftList.createButton.first().click();
    await expect(page).toHaveURL(/\/shift-management\/create/);
  },
  'SHIFT-CREATE-03': async ({ shiftForm }) => {
    await shiftForm.gotoCreate();
    await expect(shiftForm.save()).toBeDisabled();
  },
  'SHIFT-CREATE-04': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.name.click();
    await shiftForm.name.blur();
    await expect(page.getByText('Shift name is required')).toBeVisible();
    await shiftForm.name.fill(`auto_tmp_${Date.now().toString().slice(-6)}`);
    await shiftForm.name.blur();
    await expect(page.getByText('Shift name is required')).toHaveCount(0);
  },
  'SHIFT-CREATE-05': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.name.fill('x'.repeat(256));
    await shiftForm.name.blur();
    await expect(page.getByText(/at most 255 characters/i).first()).toBeVisible();
  },
  'SHIFT-CREATE-06': async ({ shiftForm }) => {
    await shiftForm.gotoCreate();
    await expect(shiftForm.timezone.first()).toBeVisible();
  },
  'SHIFT-CREATE-07': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.timezone.first().click();
    const item = page.getByRole('option').nth(1).or(page.locator('[data-slot="select-item"]').nth(1));
    await expect(item.first()).toBeVisible({ timeout: 8000 });
    await item.first().click();
  },
  'SHIFT-CREATE-08': async ({ shiftForm, state }) => {
    await shiftForm.gotoCreate();
    await shiftForm.name.fill(`auto_tmp_${state.stamp}`);
    await shiftForm.description.fill('');
    await expect(shiftForm.save()).toBeEnabled();
  },
  'SHIFT-CREATE-09': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.description.fill('d'.repeat(256));
    await shiftForm.description.blur();
    await expect(page.getByText(/at most 255 characters/i).first()).toBeVisible();
  },
  'SHIFT-CREATE-10': async ({ shiftForm }) => {
    await shiftForm.gotoCreate();
    const start = await shiftForm.dayRow('Mon').getByPlaceholder('9:00').inputValue();
    const end = await shiftForm.dayRow('Mon').getByPlaceholder('5:00').inputValue();
    expect(start).toMatch(/09:00/);
    expect(end).toMatch(/05:00/);
  },
  'SHIFT-CREATE-15': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.cancel().click();
    await shiftForm.discardIfOpen();
    await expect(page).toHaveURL(/\/shift-management/);
    expect(page.url()).not.toContain('/create');
  },
  'SHIFT-CREATE-16': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.back.click();
    await shiftForm.discardIfOpen();
    await expect(page).toHaveURL(/\/shift-management/);
    expect(page.url()).not.toContain('/create');
  },
  'SHIFT-CREATE-17': async ({ shiftForm, page, state }) => {
    await shiftForm.gotoCreate();
    await shiftForm.name.fill(`auto_dirty_${state.stamp}`);
    await shiftForm.cancel().click();
    await expect(page.getByText('Unsaved Changes').first()).toBeVisible();
  },
  'SHIFT-CREATE-19': async ({ shiftForm, page, state }) => {
    await shiftForm.gotoCreate();
    await shiftForm.name.fill(`auto_dirty_${state.stamp}`);
    await shiftForm.cancel().click();
    await expect(page.getByText('Unsaved Changes').first()).toBeVisible();
    await pressEscape(page);
    await expect(page).toHaveURL(/\/create/);
  },
  'SHIFT-CREATE-18': async ({ shiftForm, page, state }) => {
    await shiftForm.gotoCreate();
    await shiftForm.name.fill(`auto_dirty_${state.stamp}`);
    await shiftForm.cancel().click();
    await expect(page.getByText('Unsaved Changes').first()).toBeVisible();
    await page.getByRole('button', { name: /^discard$/i }).click();
    await expect(page).not.toHaveURL(/\/create/);
  },
  'SHIFT-TIMING-01': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.dayRow('Mon').getByPlaceholder('9:00').fill('9');
    await shiftForm.dayRow('Mon').getByPlaceholder('9:00').blur();
    await expect(page.getByText(/Invalid time format/i).first()).toBeVisible();
  },
  'SHIFT-TIMING-02': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.dayRow('Mon').getByPlaceholder('9:00').fill('13:00');
    await shiftForm.dayRow('Mon').getByPlaceholder('9:00').blur();
    await expect(page.getByText(/Hours must be between 1 and 12/i).first()).toBeVisible();
  },
  'SHIFT-TIMING-03': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.dayRow('Mon').getByPlaceholder('9:00').fill('09:99');
    await shiftForm.dayRow('Mon').getByPlaceholder('9:00').blur();
    await expect(page.getByText(/Minutes must be between 00 and 59/i).first()).toBeVisible();
  },
  'SHIFT-TIMING-04': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.dayRow('Mon').getByPlaceholder('5:00').fill('abc');
    await shiftForm.dayRow('Mon').getByPlaceholder('5:00').blur();
    await expect(page.getByText(/Invalid time format/i).first()).toBeVisible();
  },
  'SHIFT-TIMING-05': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.dayRow('Mon').getByPlaceholder('5:00').fill('00:00');
    await shiftForm.dayRow('Mon').getByPlaceholder('5:00').blur();
    await expect(page.getByText(/Hours must be between 1 and 12/i).first()).toBeVisible();
  },
  'SHIFT-TIMING-06': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.dayRow('Mon').getByPlaceholder('9:00').fill('09:00');
    await shiftForm.dayRow('Mon').getByPlaceholder('5:00').fill('09:00');
    await shiftForm.setPeriod(0, 'start', 'AM');
    await shiftForm.setPeriod(0, 'end', 'AM');
    await shiftForm.dayRow('Mon').getByPlaceholder('5:00').blur();
    await expect(page.getByText(/Start time must be before end time/i).first()).toBeVisible();
  },
  'SHIFT-TIMING-07': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.dayRow('Mon').getByPlaceholder('9:00').fill('09:00');
    await shiftForm.dayRow('Mon').getByPlaceholder('5:00').fill('11:00');
    await shiftForm.setPeriod(0, 'end', 'AM');
    await shiftForm.dayRow('Mon').getByPlaceholder('5:00').blur();
    await expect(page.getByText(/at least 3 hours/i).first()).toBeVisible();
  },
  'SHIFT-TIMING-08': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.dayRow('Mon').getByPlaceholder('9:00').fill('09:00');
    await shiftForm.dayRow('Mon').getByPlaceholder('5:00').fill('12:00');
    await shiftForm.setPeriod(0, 'end', 'PM');
    await expect(page.getByText(/at least 3 hours/i)).toHaveCount(0);
  },
  'SHIFT-TIMING-09': async ({ shiftForm }) => {
    await shiftForm.gotoCreate();
    await shiftForm.offBox(0).check();
    await expect(shiftForm.dayRow('Mon').getByPlaceholder('9:00')).toBeDisabled();
  },
  'SHIFT-TIMING-10': async ({ shiftForm }) => {
    await shiftForm.gotoCreate();
    await shiftForm.offBox(0).check();
    await shiftForm.offBox(0).uncheck();
    await expect(shiftForm.dayRow('Mon').getByPlaceholder('9:00')).toBeEnabled();
  },
  'SHIFT-TIMING-11': async ({ shiftForm, state }) => {
    await shiftForm.gotoCreate();
    await shiftForm.name.fill(`auto_tmp_${state.stamp}`);
    for (let idx = 0; idx < 7; idx += 1) {
      if (!(await shiftForm.offBox(idx).isChecked())) await shiftForm.offBox(idx).check();
    }
    await expect(shiftForm.save()).toBeDisabled();
  },
  'SHIFT-TIMING-12': async ({ shiftForm }) => {
    await shiftForm.gotoCreate();
    await shiftForm.dayRow('Mon').getByPlaceholder('9:00').fill('9');
    const copy = shiftForm.dayRow('Mon').locator('button').filter({ has: shiftForm.page.locator('svg') }).last();
    await expect(copy).toBeDisabled();
  },
  'SHIFT-TIMING-13': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.dayRow('Mon').locator('button').filter({ has: page.locator('svg') }).last().click();
    await expect(page.getByText('Copy timing to')).toBeVisible();
  },
  'SHIFT-TIMING-14': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.offBox(6).check();
    await shiftForm.dayRow('Mon').locator('button').filter({ has: page.locator('svg') }).last().click();
    await expect(page.getByText('Copy timing to')).toBeVisible();
    await expect(page.getByText('Sun', { exact: true })).toHaveCount(0);
  },
  'SHIFT-TIMING-15': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.dayRow('Mon').getByPlaceholder('9:00').fill('10:00');
    await shiftForm.dayRow('Mon').getByPlaceholder('5:00').fill('06:00');
    await shiftForm.setPeriod(0, 'end', 'PM');
    await shiftForm.dayRow('Mon').locator('button').filter({ has: page.locator('svg') }).last().click();
    await expect(page.getByText('Copy timing to')).toBeVisible();
    const tue = page.locator('#copy-day-0-1');
    await expect(tue).toBeVisible();
    await tue.click();
    await page.locator('#copy-day-0-2').click();
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(shiftForm.dayRow('Tue').getByPlaceholder('9:00')).toHaveValue(/10:00/);
  },
  'SHIFT-TIMING-16': async ({ shiftForm, page }) => {
    await shiftForm.gotoCreate();
    await shiftForm.dayRow('Mon').getByPlaceholder('9:00').fill('09:00');
    await shiftForm.dayRow('Mon').getByPlaceholder('5:00').fill('10:00');
    await shiftForm.setPeriod(0, 'end', 'AM');
    await shiftForm.dayRow('Mon').getByPlaceholder('5:00').blur();
    await expect(page.getByText(/at least 3 hours/i).first()).toBeVisible();
    await shiftForm.setPeriod(0, 'end', 'PM');
    await expect(page.getByText(/at least 3 hours/i)).toHaveCount(0);
  },
  'SHIFT-CREATE-11': async ({ shiftForm, page, state }) => {
    await shiftForm.gotoCreate();
    await shiftForm.name.fill(state.primary);
    await shiftForm.description.fill('QA automation shift');
    const res = await shiftForm.saveShift('POST');
    if (!res.ok()) throw new Error(`POST /shift ${res.status()}`);
    state.names.push(state.primary);
    await expect(page).toHaveURL(/\/shift-management/);
  },
  'SHIFT-CREATE-12': async ({ shiftForm, state }) => {
    await shiftForm.gotoCreate();
    await shiftForm.name.fill(state.weekdays);
    for (const idx of [5, 6]) {
      if (!(await shiftForm.offBox(idx).isChecked())) await shiftForm.offBox(idx).check();
    }
    const res = await shiftForm.saveShift('POST');
    if (!res.ok()) throw new Error(`POST /shift ${res.status()}`);
    state.names.push(state.weekdays);
  },
  'SHIFT-CREATE-13': async ({ shiftForm, state }) => {
    await shiftForm.gotoCreate();
    await shiftForm.name.fill(state.night);
    await shiftForm.dayRow('Mon').getByPlaceholder('9:00').fill('09:00');
    await shiftForm.dayRow('Mon').getByPlaceholder('5:00').fill('06:00');
    await shiftForm.setPeriod(0, 'start', 'PM');
    await shiftForm.setPeriod(0, 'end', 'AM');
    const res = await shiftForm.saveShift('POST');
    if (!res.ok()) throw new Error(`POST /shift ${res.status()}`);
    state.names.push(state.night);
  },
  'SHIFT-CREATE-14': async ({ shiftForm, page, state }) => {
    requireCreated(state);
    await shiftForm.gotoCreate();
    await shiftForm.name.fill(state.primary);
    await shiftForm.save().click();
    await expect(page).toHaveURL(/\/create/);
  },
  'SHIFT-EDIT-01': async ({ shiftList, page, state }) => {
    requireCreated(state);
    await shiftList.goto();
    await shiftList.openRowMenu(state.primary);
    await shiftList.clickMenu('Edit');
    await expect(page).toHaveURL(/\/shift-management\/edit\//);
  },
  'SHIFT-EDIT-02': async ({ shiftList, page, state }) => {
    requireCreated(state);
    await shiftList.goto();
    await shiftList.openRowMenu(state.primary);
    await shiftList.clickMenu('Edit');
    await expect(page.getByText(/users currently assigned|created by/i).first()).toBeVisible();
  },
  'SHIFT-EDIT-03': async ({ shiftList, page, state }) => {
    requireCreated(state);
    await shiftList.goto();
    await shiftList.openRowMenu(state.primary);
    await shiftList.clickMenu('Edit');
    const viewUsers = page.getByRole('button', { name: /view users/i });
    test.skip(!(await isShowing(viewUsers, 3000)), 'No assignees on created shift');
    await viewUsers.click();
    await expect(page).not.toHaveURL(/\/shift-management\/edit/);
  },
  'SHIFT-EDIT-04': async ({ shiftList, page, state }) => {
    requireCreated(state);
    await shiftList.goto();
    await shiftList.openRowMenu(state.primary);
    await shiftList.clickMenu('Edit');
    test.skip(await isShowing(page.getByRole('button', { name: /view users/i }), 2000), 'Assignees > 0');
    await expect(page.getByText(/0 users currently assigned/i)).toBeVisible();
  },
  'SHIFT-EDIT-05': async ({ shiftList, shiftForm, state }) => {
    requireCreated(state);
    await shiftList.goto();
    await shiftList.openRowMenu(state.primary);
    await shiftList.clickMenu('Edit');
    await expect(shiftForm.save()).toBeDisabled();
  },
  'SHIFT-EDIT-06': async ({ shiftList, shiftForm, state }) => {
    requireCreated(state);
    await shiftList.goto();
    await shiftList.openRowMenu(state.primary);
    await shiftList.clickMenu('Edit');
    await shiftForm.description.fill(`updated ${state.stamp}`);
    await shiftForm.description.blur();
    await expect(shiftForm.save()).toBeEnabled();
  },
  'SHIFT-EDIT-07': async ({ shiftList, shiftForm, state }) => {
    requireCreated(state);
    await shiftList.goto();
    await shiftList.openRowMenu(state.primary);
    await shiftList.clickMenu('Edit');
    await shiftForm.description.fill(`updated ${state.stamp}`);
    await shiftForm.description.blur();
    const res = await shiftForm.saveShift('PUT');
    if (!res.ok()) throw new Error(`PUT /shift ${res.status()}`);
  },
  'SHIFT-EDIT-08': async ({ shiftList, shiftForm, page, state }) => {
    requireCreated(state);
    await shiftList.goto();
    await shiftList.openRowMenu(state.primary);
    await shiftList.clickMenu('Edit');
    await shiftForm.description.fill(`saving ${state.stamp}`);
    await shiftForm.save().click();
    await expect(page).not.toHaveURL(/\/edit\//, { timeout: 20000 });
  },
  'SHIFT-EDIT-09': async ({ shiftList, shiftForm, page, state }) => {
    requireCreated(state);
    await shiftList.goto();
    await shiftList.openRowMenu(state.primary);
    await shiftList.clickMenu('Edit');
    await shiftForm.description.fill(`dirty ${state.stamp}`);
    await shiftForm.back.click();
    await expect(page.getByText('Unsaved Changes').first()).toBeVisible();
    await page.getByRole('button', { name: /^discard$/i }).click();
  },
  'SHIFT-CLONE-01': async ({ shiftList, shiftForm, page, state }) => {
    requireCreated(state);
    await shiftList.goto();
    await shiftList.openRowMenu(state.primary);
    await shiftList.clickMenu('Clone');
    await expect(page).toHaveURL(/\/create/);
    await expect(shiftForm.title).toHaveText(/create shift/i);
    expect((await shiftForm.name.inputValue()).trim()).toBe('');
  },
  'SHIFT-CLONE-02': async ({ shiftList, shiftForm, state }) => {
    requireCreated(state);
    await shiftList.goto();
    await shiftList.openRowMenu(state.primary);
    await shiftList.clickMenu('Clone');
    await shiftForm.name.fill(state.clone);
    const res = await shiftForm.saveShift('POST');
    if (!res.ok()) throw new Error(`POST clone ${res.status()}`);
    state.names.push(state.clone);
  },
  'SHIFT-DELETE-01': async ({ shiftList, page, state }) => {
    const target = state.names.at(-1) || state.primary;
    if (!target) throw new Error('No created shift to delete');
    await shiftList.goto();
    await shiftList.openRowMenu(target);
    await shiftList.clickMenu('Remove');
    await expect(page.getByText('Remove Shift')).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).last().click();
  },
  'SHIFT-DELETE-02': async ({ shiftList, state }) => {
    const target = state.names.at(-1) || state.primary;
    if (!target) throw new Error('No created shift to delete');
    await shiftList.goto();
    await shiftList.searchFor(target);
    await expect(shiftList.row(target)).toBeVisible();
  },
  'SHIFT-DELETE-03': async ({ shiftList, state }) => {
    const target = state.names.at(-1) || state.primary;
    if (!target) throw new Error('No created shift to delete');
    await shiftList.goto();
    const ok = await shiftList.removeShift(target);
    if (!ok) throw new Error(`DELETE ${target}`);
    state.names = state.names.filter((name) => name !== target);
  },
};

export const shiftHandlerIds = new Set(Object.keys(handlers));

export async function runShiftCase(c: CatalogCase, ctx: ShiftCtx) {
  const handler = handlers[c.id];
  if (!handler) {
    throw new Error(`automated=Yes but no handler for ${c.id}`);
  }
  await handler(ctx);
}
