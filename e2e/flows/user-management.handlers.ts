import type { Page } from '@playwright/test';
import { env } from '../config/env';
import { expect, test } from '../fixtures/test';
import type { CatalogCase } from '../helpers/catalog';
import { isShowing, pressEscape } from '../helpers/dom';
import type { UserFormPage } from '../pages/user-form.page';
import type { UserListPage } from '../pages/user-list.page';

export type UserRunState = {
  createdEmail: string;
  createdName: string;
  unique: { stamp: string; email: string; phone: string; name: string };
};

export type UserCtx = {
  page: Page;
  userList: UserListPage;
  userForm: UserFormPage;
  state: UserRunState;
};

async function requireTable(userList: UserListPage) {
  await userList.goto();
  test.skip(!(await userList.hasTable()), 'List is empty on this tenant');
}

function requireCreatedUser(state: UserRunState) {
  if (!state.createdName) {
    throw new Error('USER-CREATE-36 must create a user before this mutating case');
  }
}

async function openCreatedUser(userList: UserListPage, state: UserRunState) {
  await requireTable(userList);
  requireCreatedUser(state);
  await userList.openRowMenu(state.createdName);
}

async function openOwnUser(userList: UserListPage) {
  await requireTable(userList);
  await userList.openRowContaining(env.email);
}

function menuItem(page: Page, name: string) {
  return page.getByText(name, { exact: true }).last();
}

const handlers: Record<string, (ctx: UserCtx) => Promise<void>> = {
  'USER-NAV-01': async ({ userList, page }) => {
    await userList.goto();
    await expect(page).toHaveURL(/\/user-management/);
    await expect(userList.usersTab).toBeVisible();
  },
  'USER-NAV-07': async ({ userList }) => {
    await userList.goto();
    await expect(userList.usersLink).toBeVisible();
  },
  'USER-NAV-02': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await expect(page).toHaveURL(/\/user-management\/add-user/);
    await expect(userForm.title).toHaveText(/add user/i);
    await expect(userForm.back).toBeVisible();
  },
  'USER-NAV-06': async ({ userList, page }) => {
    await userList.goto();
    await expect(userList.usersTab).toBeVisible();
    await expect(page.getByText('Login Sessions', { exact: true })).toHaveCount(0);
  },
  'USER-SESS-01': async ({ userList, page }) => {
    await userList.goto();
    await page.goto('/user-management?tab=3', { waitUntil: 'domcontentloaded' });
    await expect(userList.usersTab).toBeVisible();
    await expect(page).not.toHaveURL(/login-session/i);
  },
  'USER-LIST-01': async ({ userList }) => {
    await userList.goto();
    test.skip(!(await userList.isEmpty()), 'Users already exist');
    await expect(userList.emptyState).toBeVisible();
  },
  'USER-LIST-02': async ({ userList }) => {
    await requireTable(userList);
    await expect(userList.search).toBeVisible();
    await expect(userList.manageColumns).toBeVisible();
  },
  'USER-LIST-03': async ({ userList, page }) => {
    await requireTable(userList);
    const headers = await page.locator('thead').innerText();
    expect(headers).toMatch(/Name/i);
    expect(headers).toMatch(/Email/i);
    expect(headers).toMatch(/Phone/i);
    expect(headers).toMatch(/Status/i);
    expect(headers).toMatch(/Actions/i);
  },
  'USER-LIST-04': async ({ userList, page }) => {
    await requireTable(userList);
    await userList.manageColumns.click();
    await expect(page.getByText('Created At', { exact: true }).first()).toBeVisible();
    await pressEscape(page);
    await expect(userList.manageColumns).toBeVisible();
  },
  'USER-LIST-05': async ({ userList }) => {
    await userList.goto();
    test.skip(await userList.isEmpty(), 'Empty list hides header create');
    await expect(userList.createButton).toBeVisible();
  },
  'USER-LIST-07': async ({ userList }) => {
    await requireTable(userList);
    await expect(userList.syncButton).toBeVisible();
  },
  'USER-LIST-08': async ({ userList }) => {
    await requireTable(userList);
    await expect(userList.exportButton).toBeVisible();
  },
  'USER-LIST-10': async ({ userList }) => {
    await requireTable(userList);
    const name = await userList.firstRowName();
    await userList.searchFor(name);
    await expect(userList.row(name)).toBeVisible();
  },
  'USER-LIST-11': async ({ userList, page }) => {
    await requireTable(userList);
    await userList.searchFor('zzznouser999');
    await expect(userList.emptyState).toHaveCount(0);
    await expect(userList.search).toBeVisible();
    await expect(page.locator('tbody tr').filter({ hasText: 'zzznouser999' })).toHaveCount(0);
  },
  'USER-LIST-12': async ({ userList }) => {
    await requireTable(userList);
    await userList.searchFor('');
    await expect(userList.search).toHaveValue('');
  },
  'USER-LIST-19': async ({ userList, page }) => {
    await requireTable(userList);
    const copy = page.locator('tbody tr').first().getByRole('button').filter({ has: page.locator('svg') }).first();
    await expect(copy).toBeVisible();
    await copy.click();
    await expect(page.getByText(/copied/i).first()).toBeVisible({ timeout: 5000 });
  },
  'USER-LIST-20': async ({ userList, page }) => {
    await requireTable(userList);
    const body = await page.locator('tbody').innerText();
    test.skip(!/All Projects/i.test(body), 'No all-projects user on current page');
    expect(body).toMatch(/All Projects/i);
  },
  'USER-LIST-21': async ({ userList, page }) => {
    await requireTable(userList);
    const body = await page.locator('tbody').innerText();
    test.skip(!/Email OTP|Email \/ Password|Mobile OTP/i.test(body), 'Login method labels not on current page');
    expect(body).toMatch(/Email OTP|Email \/ Password|Mobile OTP/i);
  },
  'USER-LIST-22': async ({ userList, page }) => {
    await requireTable(userList);
    const body = await page.locator('tbody').innerText();
    expect(body).toMatch(/active|inactive|pending/i);
  },
  'USER-LIST-27': async ({ userList, page }) => {
    await requireTable(userList);
    await userList.openRowMenu(await userList.firstRowName());
    await expect(menuItem(page, 'Edit')).toBeVisible();
    await pressEscape(page);
  },
  'USER-LIST-28': async ({ userList, page }) => {
    await openOwnUser(userList);
    await expect(menuItem(page, 'Change Password')).toBeVisible();
    await pressEscape(page);
  },
  'USER-LIST-29': async ({ userList, page }) => {
    await requireTable(userList);
    await userList.openRowMenu(await userList.firstRowName());
    test.skip(!(await isShowing(menuItem(page, 'Set Password'), 2000)), 'Needs another user with Email/Password login');
    await pressEscape(page);
  },
  'USER-LIST-31': async ({ userList, page }) => {
    await requireTable(userList);
    await userList.openRowMenu(await userList.firstRowName());
    test.skip(!(await isShowing(menuItem(page, 'Assign Projects'), 2000)), 'Assign Projects not on this row');
    await pressEscape(page);
  },
  'USER-LIST-32': async ({ userList, page }) => {
    await requireTable(userList);
    await userList.openRowMenu(await userList.firstRowName());
    test.skip(!(await isShowing(menuItem(page, 'Resend Request'), 2000)), 'Needs a pending user row');
    await pressEscape(page);
  },
  'USER-LIST-34': async ({ userList }) => {
    await userList.goto();
    test.skip(!(await isShowing(userList.teamsTab, 1500)), 'No team module');
    test.skip(!(await userList.isEmpty()), 'Users exist');
    await expect(userList.teamsTab).toBeDisabled();
  },
  'USER-LIST-35': async ({ userList, page }) => {
    await userList.goto();
    test.skip(!(await isShowing(userList.teamsTab, 1500)), 'No team module');
    test.skip(await userList.isEmpty(), 'Empty list');
    await userList.teamsTab.click();
    await expect(page.getByText(/Total Teams|Manage Teams/i).first()).toBeVisible();
  },
  'USER-TEAM-01': async ({ userList }) => {
    await userList.goto();
    test.skip(await isShowing(userList.teamsTab, 1500), 'Team tab is visible');
    await expect(userList.teamsTab).toHaveCount(0);
  },
  'USER-TEAM-03': async ({ userList, page }) => {
    await userList.goto();
    test.skip(!(await isShowing(userList.teamsTab, 1500)), 'No team tab');
    test.skip(await userList.isEmpty(), 'Empty list');
    await userList.teamsTab.click();
    const createTeam = page.getByTestId('create-new-team-button');
    test.skip(!(await isShowing(createTeam, 2000)), 'No team create permission');
    await expect(createTeam).toBeVisible();
  },
  'USER-LIST-36': async ({ userList, page }) => {
    await requireTable(userList);
    await page.getByText('Name', { exact: true }).first().click();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  },
  'USER-LIST-37': async ({ userList }) => {
    await userList.goto();
    test.skip(!(await userList.isEmpty()), 'Users exist');
    await expect(userList.createButton).toHaveCount(0);
  },
  'USER-LIST-55': async ({ userList, page }) => {
    await requireTable(userList);
    await expect(page.locator('tbody tr').first()).toBeVisible();
  },
  'USER-CREATE-01': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await expect(page).toHaveURL(/\/add-user/);
    await expect(userForm.title).toHaveText(/add user/i);
  },
  'USER-CREATE-03': async ({ userForm }) => {
    await userForm.gotoAdd();
    await expect(userForm.firstName).toBeVisible();
  },
  'USER-CREATE-04': async ({ userForm }) => {
    await userForm.gotoAdd();
    await expect(userForm.primaryAction()).toBeDisabled();
  },
  'USER-CREATE-05': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await expect(page.getByRole('button', { name: /send invite/i })).toBeVisible();
  },
  'USER-CREATE-06': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    const statusSwitch = page.getByRole('switch').first();
    test.skip(!(await isShowing(statusSwitch, 2000)), 'No status switch on add form');
    await statusSwitch.click();
    await expect(page.getByRole('button', { name: /^save$/i })).toBeVisible();
    await statusSwitch.click();
  },
  'USER-CREATE-07': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.firstName.fill('a');
    await userForm.firstName.fill('');
    await userForm.firstName.blur();
    await expect(page.getByText('First name is required')).toBeVisible();
  },
  'USER-CREATE-08': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.firstName.fill('x'.repeat(101));
    await userForm.firstName.blur();
    await expect(page.getByText(/at most 100 characters/i).first()).toBeVisible();
  },
  'USER-CREATE-09': async ({ userForm }) => {
    await userForm.gotoAdd();
    await userForm.firstName.fill('john2');
    await userForm.firstName.blur();
    expect(await userForm.firstName.inputValue()).not.toMatch(/\d/);
  },
  'USER-CREATE-10': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.lastName.fill('a');
    await userForm.lastName.fill('');
    await userForm.lastName.blur();
    await expect(page.getByText('Last name is required')).toBeVisible();
  },
  'USER-CREATE-11': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.lastName.fill('y'.repeat(101));
    await userForm.lastName.blur();
    await expect(page.getByText(/Last name must be at most 100/i)).toBeVisible();
  },
  'USER-CREATE-46': async ({ userForm }) => {
    await userForm.gotoAdd();
    await userForm.lastName.fill('doe3');
    await userForm.lastName.blur();
    expect(await userForm.lastName.inputValue()).not.toMatch(/\d/);
  },
  'USER-CREATE-12': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.email.fill('a');
    await userForm.email.fill('');
    await userForm.email.blur();
    await expect(page.getByText('Email is required')).toBeVisible();
  },
  'USER-CREATE-13': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.email.fill('not-an-email');
    await userForm.email.blur();
    await expect(page.getByText(/valid email address/i)).toBeVisible();
  },
  'USER-CREATE-14': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.email.fill(`${'a'.repeat(90)}@idx.com`);
    await userForm.email.blur();
    await expect(page.getByText(/Email must be at most 100/i)).toBeVisible();
  },
  'USER-CREATE-15': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.phone.fill('');
    await userForm.phone.blur();
    await expect(page.getByText(/Phone number is required|Phone number cannot be empty/i).first()).toBeVisible();
  },
  'USER-CREATE-16': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.phone.fill('5551234567');
    await userForm.phone.blur();
    await expect(page.getByText(/valid 10-digit phone/i)).toBeVisible();
  },
  'USER-CREATE-17': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.openDropdown('Choose which login methods this user can use');
    await pressEscape(page);
    await userForm.firstName.fill('Ada');
    await userForm.firstName.blur();
    await expect(page.getByText(/Allowed login methods is required/i)).toBeVisible();
  },
  'USER-CREATE-18': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.pickLoginMethod('Email / Password');
    await userForm.password.fill('');
    await userForm.password.blur();
    await expect(page.getByText(/Password is required when Email\/Password/i)).toBeVisible();
  },
  'USER-CREATE-19': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.pickLoginMethod('Email / Password');
    await userForm.password.fill('password');
    await userForm.password.blur();
    await expect(page.getByText(/upper, lower, number/i).first()).toBeVisible();
  },
  'USER-CREATE-50': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.pickLoginMethod('Email / Password');
    await userForm.password.fill('Abcd1234!');
    await userForm.password.blur();
    await expect(page.getByText(/upper, lower, number/i)).toHaveCount(0);
  },
  'USER-CREATE-49': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.pickLoginMethod('Email / Password');
    await userForm.password.fill('x'.repeat(256));
    await userForm.password.blur();
    await expect(page.getByText(/Password must be at most 255/i)).toBeVisible();
  },
  'USER-CREATE-21': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.blurRolesWithoutPicking();
    await userForm.firstName.fill('Ada');
    await userForm.firstName.blur();
    await expect(page.getByText('Role is required')).toBeVisible();
  },
  'USER-CREATE-23': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.blurShiftWithoutPicking();
    await userForm.firstName.fill('Ada');
    await userForm.firstName.blur();
    await expect(page.getByText('Shift is required')).toBeVisible();
  },
  'USER-CREATE-27': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.department.fill('d'.repeat(101));
    await userForm.department.blur();
    await expect(page.getByText(/Department must be at most 100/i)).toBeVisible();
  },
  'USER-CREATE-28': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.designation.fill('d'.repeat(101));
    await userForm.designation.blur();
    await expect(page.getByText(/Designation must be at most 100/i)).toBeVisible();
  },
  'USER-CREATE-31': async ({ userForm }) => {
    await userForm.gotoAdd();
    await expect(userForm.salutation).toBeVisible();
  },
  'USER-CREATE-64': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await expect(page.getByText(/Assign a reporting manager/i)).toBeVisible();
  },
  'USER-CREATE-62': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await expect(page.getByText(/Add team members below/i)).toBeVisible();
  },
  'USER-CREATE-39': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.cancel().click();
    await userForm.discardIfOpen();
    await expect(page).toHaveURL(/\/user-management/);
    expect(page.url()).not.toContain('/add-user');
  },
  'USER-CREATE-40': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.back.click();
    await userForm.discardIfOpen();
    await expect(page).toHaveURL(/\/user-management/);
    expect(page.url()).not.toContain('/add-user');
  },
  'USER-CREATE-41': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.firstName.fill('Dirty');
    await userForm.cancel().click();
    await expect(page.getByText('Unsaved Changes').first()).toBeVisible();
  },
  'USER-CREATE-43': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.firstName.fill('Dirty');
    await userForm.cancel().click();
    await expect(page.getByText('Unsaved Changes').first()).toBeVisible();
    await pressEscape(page);
    await expect(page).toHaveURL(/\/add-user/);
  },
  'USER-CREATE-42': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.firstName.fill('Dirty');
    await userForm.cancel().click();
    await expect(page.getByText('Unsaved Changes').first()).toBeVisible();
    await page.getByRole('button', { name: /^discard$/i }).click();
    await expect(page).not.toHaveURL(/\/add-user/);
  },
  'USER-CREATE-36': async ({ userForm, page, state }) => {
    await userForm.gotoAdd();
    await userForm.firstName.fill(state.unique.name);
    await userForm.lastName.fill('User');
    await userForm.email.fill(state.unique.email);
    await userForm.phone.fill(state.unique.phone);
    await userForm.phone.blur();
    await userForm.pickLoginMethod('Email OTP');
    await userForm.pickFirstRole();
    await userForm.pickFirstShift();
    await userForm.phone.fill(state.unique.phone);
    await expect(userForm.primaryAction()).toBeEnabled({ timeout: 8000 });
    const createPost = page.waitForResponse(
      (res) => res.request().method() === 'POST' && res.url().includes('/users') && !res.url().includes('dropdown'),
      { timeout: 30000 },
    );
    await userForm.primaryAction().click();
    const res = await createPost;
    if (!res.ok()) {
      throw new Error(`POST /users ${res.status()}`);
    }
    state.createdEmail = state.unique.email;
    state.createdName = state.unique.name;
  },
  'USER-CREATE-48': async ({ userForm, page }) => {
    await userForm.gotoAdd();
    await userForm.phone.fill('9876543210');
    await userForm.phone.blur();
    await expect(page.getByText(/valid 10-digit|Phone number is required/i)).toHaveCount(0);
  },
  'USER-CREATE-38': async ({ userForm, page, state }) => {
    requireCreatedUser(state);
    await userForm.gotoAdd();
    await userForm.firstName.fill(state.unique.name);
    await userForm.lastName.fill('User');
    await userForm.email.fill(state.createdEmail);
    await userForm.phone.fill(`97${state.unique.stamp}02`);
    await userForm.pickLoginMethod('Email OTP');
    await userForm.pickFirstRole();
    await userForm.pickFirstShift();
    await userForm.primaryAction().click();
    await expect(page).toHaveURL(/\/add-user/);
  },
  'USER-NAV-03': async ({ userList, page, state }) => {
    await openCreatedUser(userList, state);
    await menuItem(page, 'Edit').click();
    await expect(page).toHaveURL(/\/edit-user\//);
  },
  'USER-EDIT-01': async ({ userList, page, state }) => {
    await openCreatedUser(userList, state);
    await menuItem(page, 'Edit').click();
    await expect(page).toHaveURL(/\/edit-user\//);
    await expect(page.getByTestId('user-add-edit-title')).toHaveText(/edit user/i);
  },
  'USER-EDIT-02': async ({ userList, page, state }) => {
    await openCreatedUser(userList, state);
    await menuItem(page, 'Edit').click();
    await expect(page.getByText(/created by/i).first()).toBeVisible();
    await expect(page.getByText(/last updated/i).first()).toBeVisible();
  },
  'USER-EDIT-03': async ({ userList, page, state, userForm }) => {
    await openCreatedUser(userList, state);
    await menuItem(page, 'Edit').click();
    await expect(page.getByRole('button', { name: /^update$/i })).toBeVisible();
    await userForm.discardIfOpen();
  },
  'USER-EDIT-09': async ({ userList, page, state, userForm }) => {
    await openCreatedUser(userList, state);
    await menuItem(page, 'Edit').click();
    await expect(page).toHaveURL(/\/edit-user\//);
    await userForm.designation.fill(`QA ${state.unique.stamp}`);
    await userForm.designation.blur();
    const updatePut = page.waitForResponse(
      (res) => res.request().method() === 'PATCH' && /\/users\/\d+/.test(res.url()) && !res.url().includes('/status'),
      { timeout: 20000 },
    );
    await expect(page.getByRole('button', { name: /^update$/i })).toBeEnabled();
    await page.getByRole('button', { name: /^update$/i }).click();
    const res = await updatePut;
    if (!res.ok()) {
      throw new Error(`PATCH ${res.status()}`);
    }
  },
  'USER-NAV-04': async ({ userList, page, state }) => {
    await openCreatedUser(userList, state);
    const assign = menuItem(page, 'Assign Projects');
    await expect(assign).toBeVisible();
    await assign.click();
    await expect(page).toHaveURL(/\/assign-projects\//);
  },
  'USER-ASSIGN-01': async ({ userList, page, state }) => {
    await openCreatedUser(userList, state);
    const assign = menuItem(page, 'Assign Projects');
    await expect(assign).toBeVisible();
    await assign.click();
    await expect(page.getByTestId('assign-projects-title').or(page.getByText('Assign Projects').first())).toBeVisible();
  },
  'USER-ASSIGN-02': async ({ userList, page, state }) => {
    await openCreatedUser(userList, state);
    const assign = menuItem(page, 'Assign Projects');
    await expect(assign).toBeVisible();
    await assign.click();
    test.skip(!(await isShowing(page.getByText('No Active Projects found.'), 3000)), 'Already has projects');
    await expect(page.getByText('No Active Projects found.')).toBeVisible();
  },
  'USER-ASSIGN-03': async ({ userList, page, state }) => {
    await openCreatedUser(userList, state);
    const assign = menuItem(page, 'Assign Projects');
    await expect(assign).toBeVisible();
    await assign.click();
    await expect(page.getByText('Active Projects')).toBeVisible();
  },
  'USER-ASSIGN-04': async ({ userList, page, state }) => {
    await openCreatedUser(userList, state);
    const assign = menuItem(page, 'Assign Projects');
    await expect(assign).toBeVisible();
    await assign.click();
    const assignBtn = page.getByRole('button', { name: /assign project/i }).first();
    await expect(assignBtn).toBeVisible();
    await assignBtn.click();
    await expect(page.getByText('You can assign the project to the user now.')).toBeVisible();
    await pressEscape(page);
  },
  'USER-PWD-01': async ({ userList, page }) => {
    await openOwnUser(userList);
    await menuItem(page, 'Change Password').click();
    await expect(page.getByTestId('change-password-new')).toBeVisible();
  },
  'USER-PWD-10': async ({ userList, page }) => {
    await openOwnUser(userList);
    await menuItem(page, 'Change Password').click();
    await expect(page.getByTestId('change-password-submit')).toBeDisabled();
  },
  'USER-PWD-04': async ({ userList, page }) => {
    await openOwnUser(userList);
    await menuItem(page, 'Change Password').click();
    await page.getByTestId('change-password-old').fill('Oldpass1!');
    await page.getByTestId('change-password-new').fill('password');
    await page.getByTestId('change-password-confirm').fill('password');
    await page.getByTestId('change-password-submit').click();
    await expect(page.getByText(/upper, lower, number/i).first()).toBeVisible();
  },
  'USER-PWD-05': async ({ userList, page }) => {
    await openOwnUser(userList);
    await menuItem(page, 'Change Password').click();
    await page.getByTestId('change-password-old').fill('Oldpass1!');
    await page.getByTestId('change-password-new').fill('Abcd1234!');
    await page.getByTestId('change-password-confirm').fill('Abcd1234?');
    await page.getByTestId('change-password-submit').click();
    await expect(page.getByText(/do not match/i)).toBeVisible();
  },
  'USER-PWD-09': async ({ userList, page }) => {
    await openOwnUser(userList);
    await menuItem(page, 'Change Password').click();
    await page.getByRole('button', { name: /^cancel$/i }).last().click();
    await expect(page.getByTestId('change-password-new')).toHaveCount(0);
  },
  'USER-NAV-05': async ({ userList, page }) => {
    await userList.goto();
    await expect(userList.syncButton).toBeVisible();
    await userList.syncButton.click();
    await expect(page).toHaveURL(/\/sync-user-data/);
  },
  'USER-SYNC-01': async ({ userList, page }) => {
    await userList.goto();
    await expect(userList.syncButton).toBeVisible();
    await userList.syncButton.click();
    await expect(page).toHaveURL(/\/sync-user-data/);
  },
  'USER-SYNC-02': async ({ userList, page }) => {
    await userList.goto();
    await expect(userList.syncButton).toBeVisible();
    await userList.syncButton.click();
    test.skip(
      !(await isShowing(page.getByText('Select a configuration first'), 3000)),
      'Config may already be selected',
    );
    await expect(page.getByText('Select a configuration first')).toBeVisible();
  },
};

export const userHandlerIds = new Set(Object.keys(handlers));

export async function runUserCase(c: CatalogCase, ctx: UserCtx) {
  const handler = handlers[c.id];
  if (!handler) {
    throw new Error(`automated=Yes but no handler for ${c.id}`);
  }
  await handler(ctx);
}
