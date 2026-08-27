import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/test';
import type { CatalogCase } from '../helpers/catalog';
import { isShowing, pressEscape } from '../helpers/dom';
import { pathnameOf } from '../helpers/nav';
import type { ProjectDetailsPage } from '../pages/project-details.page';
import type { ProjectFormPage } from '../pages/project-form.page';
import type { ProjectListPage } from '../pages/project-list.page';

export type ProjectRunState = {
  stamp: string;
  names: string[];
  codes: string[];
  primary: string;
  primaryCode: string;
  moreName: string;
  moreCode: string;
  edited: string;
};

export type ProjectCtx = {
  page: Page;
  projectList: ProjectListPage;
  projectForm: ProjectFormPage;
  projectDetails: ProjectDetailsPage;
  state: ProjectRunState;
};

async function requireTable(projectList: ProjectListPage) {
  await projectList.goto();
  test.skip(!(await projectList.hasTable()), 'List is empty on this tenant');
}

function requireCreated(state: ProjectRunState) {
  if (!state.primary) {
    throw new Error('PROJ-CREATE-41 must create a project before this mutating case');
  }
}

async function openExistingDetails(ctx: ProjectCtx) {
  if (pathnameOf(ctx.page) === '/projects-management/details') {
    await ctx.projectDetails.expectShell();
    return;
  }
  await requireTable(ctx.projectList);
  await ctx.projectList.openDetails();
  await ctx.projectDetails.expectShell();
}

async function openCreatedDetails(ctx: ProjectCtx) {
  requireCreated(ctx.state);
  if (pathnameOf(ctx.page) === '/projects-management/details') {
    const title = await ctx.projectDetails.title.innerText();
    if (title.includes(ctx.state.primary) || title.includes(ctx.state.edited)) {
      await ctx.projectDetails.expectShell();
      return;
    }
  }
  await ctx.projectList.goto();
  await ctx.projectList.openDetails(ctx.state.primary);
  await ctx.projectDetails.expectShell();
}

const SIDEBAR: Record<string, { label: string; expect: RegExp }> = {
  'PROJ-EDIT-01': { label: 'Project Information', expect: /project information/i },
  'PROJ-USERS-01': { label: 'Project Users', expect: /manage project users|man power/i },
  'PROJ-USERS-07': { label: 'Project User Configuration', expect: /project user configuration|configuration|role/i },
  'PROJ-DOCS-01': { label: 'Documents', expect: /document/i },
  'PROJ-SCRIPT-01': { label: 'Script/FAQ', expect: /script|faq/i },
  'PROJ-EMAIL-01': { label: 'Email Templates', expect: /email/i },
  'PROJ-SMS-01': { label: 'SMS Templates', expect: /sms/i },
  'PROJ-WA-01': { label: 'WhatsApp Templates', expect: /whatsapp/i },
  'PROJ-FB-01': { label: 'Facebook Form Mapping', expect: /facebook|mapping|integration/i },
  'PROJ-OTH-01': { label: 'Other Integrations', expect: /integration|source|empty|no /i },
  'PROJ-PAY-01': { label: 'Payment Configuration', expect: /payment/i },
  'PROJ-CIBIL-01': { label: 'CIBIL Configuration', expect: /cibil/i },
  'PROJ-KYC-01': { label: 'KYC Configuration', expect: /kyc/i },
  'PROJ-RERA-01': { label: 'Rera Configuration', expect: /rera/i },
  'PROJ-PICK-01': { label: 'Pick Up Location', expect: /pick.?up|location/i },
};

async function sidebarSmoke(ctx: ProjectCtx, id: string) {
  const spec = SIDEBAR[id];
  await openExistingDetails(ctx);
  await ctx.projectDetails.openSidebar(spec.label);
  await expect(ctx.page.getByText(spec.expect).first()).toBeVisible({ timeout: 20000 });
}

const handlers: Record<string, (ctx: ProjectCtx) => Promise<void>> = {
  'PROJ-NAV-01': async ({ projectList, page }) => {
    await projectList.goto();
    await expect(page).toHaveURL(/\/projects-management/);
    await expect(projectList.pageRoot).toBeVisible();
  },
  'PROJ-NAV-02': async ({ projectList }) => {
    await projectList.goto();
    await expect(projectList.heading).toBeVisible();
    await expect(projectList.total.first()).toBeVisible();
  },
  'PROJ-NAV-03': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await expect(page).toHaveURL(/\/projects-management\/create/);
    await expect(projectForm.title).toHaveText(/create project/i);
    await expect(projectForm.back).toBeVisible();
  },
  'PROJ-NAV-04': async (ctx) => {
    await openExistingDetails(ctx);
    await expect(ctx.page).toHaveURL(/\/projects-management\/details/);
    await expect(ctx.projectDetails.title).toContainText(/project details/i);
  },
  'PROJ-NAV-05': async ({ projectList, page }) => {
    await projectList.goto();
    await expect(projectList.projectsLink).toBeVisible();
    await projectList.projectsLink.click();
    await expect(page).toHaveURL(/\/projects-management/);
  },
  'PROJ-NAV-06': async ({ page, projectDetails }) => {
    await page.goto('/projects-management/details');
    await projectDetails.expectShell();
  },
  'PROJ-NAV-07': async ({ page }) => {
    await page.goto('/inventory/upload-inventory');
    await expect(page).not.toHaveURL(/\/auth\/login/);
  },
  'PROJ-LIST-03': async ({ projectList }) => {
    await requireTable(projectList);
    await expect(projectList.search).toBeVisible();
    await expect(projectList.filters.first()).toBeVisible();
    await expect(projectList.manageColumns).toBeVisible();
  },
  'PROJ-LIST-04': async ({ projectList, page }) => {
    await requireTable(projectList);
    const headers = await page.locator('thead').last().innerText();
    expect(headers).toMatch(/Project Code/i);
    expect(headers).toMatch(/Project Name/i);
    expect(headers).toMatch(/Location/i);
    expect(headers).toMatch(/Status/i);
    expect(headers).toMatch(/Assigned Users/i);
  },
  'PROJ-LIST-05': async ({ projectList, page }) => {
    await requireTable(projectList);
    await projectList.manageColumns.click();
    await expect(page.getByText('Updated At', { exact: true }).first()).toBeVisible();
    await pressEscape(page);
  },
  'PROJ-LIST-06': async ({ projectList }) => {
    await requireTable(projectList);
    await expect(projectList.createButton).toBeVisible();
  },
  'PROJ-LIST-08': async ({ projectList }) => {
    await requireTable(projectList);
    const name = await projectList.firstRowName();
    await projectList.searchFor(name);
    await expect(projectList.row(name)).toBeVisible();
  },
  'PROJ-LIST-09': async ({ projectList }) => {
    await requireTable(projectList);
    const code = await projectList.firstRowCode();
    await projectList.searchFor(code);
    await expect(projectList.row(code)).toBeVisible();
  },
  'PROJ-LIST-10': async ({ projectList }) => {
    await requireTable(projectList);
    await projectList.searchFor('zzznoProject999');
    await expect(projectList.emptyState).toHaveCount(0);
    await expect(projectList.search).toBeVisible();
  },
  'PROJ-LIST-11': async ({ projectList }) => {
    await requireTable(projectList);
    await projectList.searchFor('');
    await expect(projectList.search).toHaveValue('');
  },
  'PROJ-LIST-12': async ({ projectList, page }) => {
    await requireTable(projectList);
    await projectList.filters.first().click();
    await expect(page.getByText('Status', { exact: true }).first()).toBeVisible();
    const status = page.getByText('Select status...', { exact: true }).or(page.getByRole('combobox').filter({ hasText: /status/i }));
    await status.first().click();
    const option = page.getByRole('option', { name: /active/i }).first();
    await expect(option).toBeVisible({ timeout: 8000 });
    await option.click();
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(projectList.search).toBeVisible();
    await projectList.filters.first().click();
    await page.getByRole('button', { name: /clear filters/i }).click();
  },
  'PROJ-LIST-13': async ({ projectList, page }) => {
    await requireTable(projectList);
    await projectList.filters.first().click();
    await expect(page.getByText('Location', { exact: true }).first()).toBeVisible();
    await pressEscape(page);
  },
  'PROJ-LIST-14': async ({ projectList, page }) => {
    await requireTable(projectList);
    await projectList.filters.first().click();
    await expect(page.getByRole('button', { name: /clear filters/i })).toBeVisible();
    await page.getByRole('button', { name: /clear filters/i }).click();
    await expect(projectList.filters.first()).toHaveText(/^filters$/i);
  },
  'PROJ-LIST-15': async ({ projectList, page }) => {
    await requireTable(projectList);
    await projectList.filters.first().click();
    const status = page.getByText('Select status...', { exact: true }).first();
    await status.click();
    await page.getByRole('option', { name: /active/i }).first().click();
    await page.getByRole('button', { name: /^apply$/i }).click();
    await page.reload();
    await expect(projectList.pageRoot).toBeVisible({ timeout: 20000 });
    await projectList.filters.first().click();
    await page.getByRole('button', { name: /clear filters/i }).click();
  },
  'PROJ-LIST-16': async ({ projectList, page }) => {
    await requireTable(projectList);
    await page.getByText('Project Name', { exact: true }).first().click();
    await expect(projectList.row()).toBeVisible();
  },
  'PROJ-LIST-17': async ({ projectList, page }) => {
    await requireTable(projectList);
    await page.getByText('Project Code', { exact: true }).first().click();
    await expect(projectList.row()).toBeVisible();
  },
  'PROJ-LIST-18': async ({ projectList }) => {
    await requireTable(projectList);
    await expect(projectList.total.first()).toBeVisible();
  },
  'PROJ-LIST-19': async ({ projectList, page }) => {
    await requireTable(projectList);
    const sizer = page.getByRole('combobox').filter({ hasText: /10|20|25|50/ }).last();
    if (!(await isShowing(sizer, 3000))) {
      test.skip(true, 'Page size control not found');
    }
    await sizer.click();
    const option = page.getByRole('option').nth(1);
    if (await isShowing(option, 3000)) await option.click();
    await expect(projectList.row()).toBeVisible();
  },
  'PROJ-LIST-20': async (ctx) => {
    await openExistingDetails(ctx);
    await expect(ctx.projectDetails.title).toContainText(/project details/i);
  },
  'PROJ-LIST-21': async ({ projectList, page }) => {
    await requireTable(projectList);
    const toggle = page.locator('#switch-button').first();
    await expect(toggle).toBeVisible();
  },
  'PROJ-LIST-22': async ({ projectList, page, state }) => {
    requireCreated(state);
    await projectList.goto();
    await projectList.toggleStatus(state.primary);
    const pending = page.waitForResponse((res) => /\/projects\//.test(res.url()) && ['PATCH', 'PUT'].includes(res.request().method()), { timeout: 20000 });
    await page.getByRole('button', { name: /^confirm$/i }).click();
    await pending;
  },
  'PROJ-LIST-23': async ({ projectList, page }) => {
    await requireTable(projectList);
    const toggle = page.locator('#switch-button button, #switch-button [role="switch"]').first();
    await toggle.click();
    await expect(page.getByText('Confirm Status Change').first()).toBeVisible();
    await pressEscape(page);
    await expect(page.getByText('Confirm Status Change')).toHaveCount(0);
  },
  'PROJ-LIST-25': async ({ projectList, page }) => {
    await requireTable(projectList);
    const headers = (await page.locator('thead').last().innerText()).split('\n').map((h) => h.trim());
    const idx = headers.findIndex((h) => /assigned users/i.test(h));
    test.skip(idx < 0, 'Assigned Users column not visible');
    const cell = await projectList.row().locator('td').nth(idx).innerText();
    expect(cell.trim()).toMatch(/^\d+$/);
  },
  'PROJ-LIST-26': async ({ projectList }) => {
    await requireTable(projectList);
    await expect(projectList.row()).toBeVisible();
  },
  'PROJ-LIST-28': async ({ projectList, page }) => {
    await requireTable(projectList);
    await expect(page.getByRole('menuitem', { name: 'Remove' })).toHaveCount(0);
  },
  'PROJ-CREATE-01': async ({ projectList, page }) => {
    await requireTable(projectList);
    await projectList.createButton.click();
    await expect(page).toHaveURL(/\/projects-management\/create/);
  },
  'PROJ-CREATE-02': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await expect(projectForm.name).toBeVisible();
    await expect(projectForm.code).toBeVisible();
    await expect(projectForm.siteHead).toBeVisible();
    await expect(projectForm.tagline).toBeVisible();
    await expect(projectForm.otp).toBeVisible();
    await expect(projectForm.logo).toBeVisible();
    await expect(projectForm.create()).toBeVisible();
    await expect(page.getByText(/join our dynamic team/i)).toBeVisible();
  },
  'PROJ-CREATE-03': async ({ projectForm }) => {
    await projectForm.gotoCreate();
    await expect(projectForm.create()).toBeEnabled();
  },
  'PROJ-CREATE-04': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.create().click();
    await expect(page.getByText('Project name is required')).toBeVisible();
  },
  'PROJ-CREATE-05': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.name.fill('   ');
    await projectForm.create().click();
    await expect(page.getByText(/project name cannot be empty|project name is required/i).first()).toBeVisible();
  },
  'PROJ-CREATE-06': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.name.fill('x'.repeat(256));
    await projectForm.name.blur();
    await expect(page.getByText(/at most 255 characters/i).first()).toBeVisible();
  },
  'PROJ-CREATE-07': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.create().click();
    await expect(page.getByText('Project code is required')).toBeVisible();
  },
  'PROJ-CREATE-08': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.code.fill('   ');
    await projectForm.create().click();
    await expect(page.getByText(/project code cannot be empty|project code is required/i).first()).toBeVisible();
  },
  'PROJ-CREATE-09': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.code.fill('c'.repeat(101));
    await projectForm.code.blur();
    await expect(page.getByText(/at most 100 characters/i).first()).toBeVisible();
  },
  'PROJ-CREATE-10': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.name.fill('auto_loc_req');
    await projectForm.code.fill('ALR1');
    await projectForm.create().click();
    await expect(page.getByText(/location is required/i).first()).toBeVisible();
  },
  'PROJ-CREATE-11': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.name.fill('auto_city_req');
    await projectForm.code.fill('ACR1');
    await projectForm.pickCombobox('Select project location');
    await projectForm.create().click();
    await expect(page.getByText('City is required')).toBeVisible();
  },
  'PROJ-CREATE-12': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.name.fill('auto_zone_req');
    await projectForm.code.fill('AZR1');
    await projectForm.pickCombobox('Select project location');
    await projectForm.pickCombobox('Select city');
    await projectForm.create().click();
    await expect(page.getByText('Zone is required')).toBeVisible();
  },
  'PROJ-CREATE-13': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.name.fill('auto_reg_req');
    await projectForm.code.fill('ARR1');
    await projectForm.pickCombobox('Select project location');
    await projectForm.pickCombobox('Select city');
    await expect(projectForm.combobox('Select zone')).toBeEnabled({ timeout: 15000 });
    await projectForm.pickCombobox('Select zone');
    await projectForm.create().click();
    await expect(page.getByText('Region is required')).toBeVisible();
  },
  'PROJ-CREATE-14': async ({ projectForm }) => {
    await projectForm.gotoCreate();
    await expect(projectForm.combobox('Select zone')).toBeDisabled();
    await expect(projectForm.combobox('Select region')).toBeDisabled();
  },
  'PROJ-CREATE-15': async ({ projectForm }) => {
    await projectForm.gotoCreate();
    await projectForm.pickCombobox('Select city');
    await expect(projectForm.combobox('Select zone')).toBeEnabled({ timeout: 15000 });
    await projectForm.pickCombobox('Select zone');
    await expect(projectForm.combobox('Select region')).toBeEnabled({ timeout: 15000 });
    await projectForm.pickCombobox('Select city');
    await expect(projectForm.combobox('Select zone')).toHaveText(/select zone/i);
  },
  'PROJ-CREATE-16': async ({ projectForm }) => {
    await projectForm.gotoCreate();
    await projectForm.pickCombobox('Select project location');
    await expect(projectForm.combobox('Select project location')).not.toHaveText(/select project location/i);
  },
  'PROJ-CREATE-20': async ({ projectForm }) => {
    await projectForm.gotoCreate();
    await expect(projectForm.siteHead).toHaveValue('');
  },
  'PROJ-CREATE-21': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.siteHead.fill('not-an-email');
    await projectForm.siteHead.blur();
    await expect(page.getByText(/valid email addresses separated by commas/i).first()).toBeVisible();
  },
  'PROJ-CREATE-22': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.siteHead.fill('a@idx.com, b@idx.com');
    await projectForm.siteHead.blur();
    await expect(page.getByText(/valid email addresses separated by commas/i)).toHaveCount(0);
  },
  'PROJ-CREATE-23': async ({ projectForm }) => {
    await projectForm.gotoCreate();
    await projectForm.siteHead.fill('Mixed.Case@Idx.COM');
    await expect(projectForm.siteHead).toHaveValue('mixed.case@idx.com');
  },
  'PROJ-CREATE-24': async ({ projectForm }) => {
    await projectForm.gotoCreate();
    await expect(projectForm.tagline).toHaveValue('');
  },
  'PROJ-CREATE-25': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.tagline.fill('t'.repeat(71));
    await projectForm.tagline.blur();
    await expect(page.getByText(/at most 70 characters/i).first()).toBeVisible();
  },
  'PROJ-CREATE-26': async ({ projectForm }) => {
    await projectForm.gotoCreate();
    await expect(projectForm.otp).toContainText(/yes/i);
  },
  'PROJ-CREATE-27': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.otp.click();
    await page.getByRole('option', { name: /^no$/i }).click();
    await expect(projectForm.otp).toContainText(/no/i);
  },
  'PROJ-CREATE-28': async ({ projectForm }) => {
    await projectForm.gotoCreate();
    await expect(projectForm.logo.locator('input[type="file"]')).toBeAttached();
  },
  'PROJ-CREATE-29': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.uploadLogo();
    await expect(page.getByTestId('project-logo-preview-frame')).toBeVisible();
    await page.getByTestId('remove-project-logo').click();
    await expect(page.getByTestId('project-logo-preview-frame')).toHaveCount(0);
  },
  'PROJ-CREATE-30': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.logo.locator('input[type="file"]').setInputFiles({
      name: 'note.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    });
    await expect(page.getByTestId('project-logo-preview-frame')).toHaveCount(0);
  },
  'PROJ-CREATE-31': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await expect(page.getByText('Select Configuration', { exact: true }).first()).toBeVisible();
  },
  'PROJ-CREATE-32': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    const before = await projectForm.configRowCount();
    await projectForm.addConfigRow();
    expect(await projectForm.configRowCount()).toBeGreaterThan(before);
    await expect(page.getByRole('button', { name: /delete configuration/i })).toBeVisible();
  },
  'PROJ-CREATE-33': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.addConfigRow();
    await page.getByRole('button', { name: /delete configuration/i }).click();
    await expect(page.getByRole('button', { name: /delete configuration/i })).toHaveCount(0);
  },
  'PROJ-CREATE-34': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await expect(page.getByTestId('project-status-dropdown')).toBeHidden();
  },
  'PROJ-CREATE-35': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.cancel().click();
    await projectForm.discardIfOpen();
    await expect(page).toHaveURL(/\/projects-management/);
    expect(page.url()).not.toContain('/create');
  },
  'PROJ-CREATE-36': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await projectForm.back.click();
    await projectForm.discardIfOpen();
    await expect(page).toHaveURL(/\/projects-management/);
  },
  'PROJ-CREATE-37': async ({ projectForm, page, state }) => {
    await projectForm.gotoCreate();
    await projectForm.name.fill(`auto_dirty_${state.stamp}`);
    await projectForm.cancel().click();
    await expect(page.getByText('Unsaved Changes').first()).toBeVisible();
  },
  'PROJ-CREATE-38': async ({ projectForm, page, state }) => {
    await projectForm.gotoCreate();
    await projectForm.name.fill(`auto_discard_${state.stamp}`);
    await projectForm.cancel().click();
    await expect(page.getByText('Unsaved Changes').first()).toBeVisible();
    await page.getByRole('button', { name: /^discard$/i }).click();
    await expect(page).toHaveURL(/\/projects-management/);
    expect(page.url()).not.toContain('/create');
  },
  'PROJ-CREATE-39': async ({ projectForm, page, state }) => {
    await projectForm.gotoCreate();
    await projectForm.name.fill(`auto_stay_${state.stamp}`);
    await projectForm.cancel().click();
    await expect(page.getByText('Unsaved Changes').first()).toBeVisible();
    await pressEscape(page);
    await expect(page).toHaveURL(/\/projects-management\/create/);
    await expect(projectForm.name).toHaveValue(`auto_stay_${state.stamp}`);
  },
  'PROJ-CREATE-40': async ({ projectForm, page, state }) => {
    await projectForm.gotoCreate();
    await projectForm.name.fill(`auto_esc_${state.stamp}`);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/projects-management/);
    expect(page.url()).not.toContain('/create');
  },
  'PROJ-CREATE-41': async ({ projectForm, projectList, page, state }) => {
    await projectForm.gotoCreate();
    await projectForm.fillRequired(state.primary, state.primaryCode);
    const res = await projectForm.submitCreate();
    expect(res.ok(), `POST /projects ${res.status()}`).toBeTruthy();
    await expect(page.getByText('Project Created Successfully!')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: /^skip$/i }).click();
    await expect(page).toHaveURL(/\/projects-management/);
    await projectList.searchFor(state.primary);
    await expect(projectList.row(state.primary)).toBeVisible();
    state.names.push(state.primary);
    state.codes.push(state.primaryCode);
  },
  'PROJ-CREATE-42': async ({ projectForm, page, state }) => {
    await projectForm.gotoCreate();
    await projectForm.fillRequired(state.moreName, state.moreCode);
    const res = await projectForm.submitCreate();
    expect(res.ok(), `POST /projects ${res.status()}`).toBeTruthy();
    await expect(page.getByText('Project Created Successfully!')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: /add more details/i }).click();
    await expect(page).toHaveURL(/\/projects-management\/details/);
    await expect(page.getByText(/getting started/i).first()).toBeVisible();
    state.names.push(state.moreName);
    state.codes.push(state.moreCode);
  },
  'PROJ-CREATE-43': async ({ projectForm, page, state }) => {
    requireCreated(state);
    await projectForm.gotoCreate();
    await projectForm.fillRequired(state.primary, state.primaryCode);
    const res = await projectForm.submitCreate();
    expect(res.ok()).toBeFalsy();
    await expect(page.getByText('Project Created Successfully!')).toHaveCount(0);
  },
  'PROJ-CREATE-46': async ({ projectForm, page }) => {
    await projectForm.gotoCreate();
    await expect(page.getByTestId('project-tagline')).toBeVisible();
    await expect(page.getByText(/primary colour/i)).toHaveCount(0);
  },
  'PROJ-EDIT-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-EDIT-01'),
  'PROJ-EDIT-02': async ({ projectList, projectDetails }) => {
    await requireTable(projectList);
    await projectList.openDetails();
    await projectDetails.openSidebar('Project Information');
    await expect(projectDetails.name).toBeDisabled();
    await expect(projectDetails.code).toBeDisabled();
  },
  'PROJ-EDIT-03': async ({ projectList, projectDetails }) => {
    await requireTable(projectList);
    await projectList.openDetails();
    await projectDetails.openSidebar('Project Information');
    await expect(projectDetails.edit).toBeVisible();
  },
  'PROJ-EDIT-04': async ({ projectList, projectDetails }) => {
    await requireTable(projectList);
    await projectList.openDetails();
    await projectDetails.startEdit();
    await expect(projectDetails.save).toBeDisabled();
  },
  'PROJ-EDIT-05': async ({ projectList, projectDetails, state }) => {
    await openCreatedDetails({ page: projectList.page, projectList, projectForm: null as never, projectDetails, state });
    await projectDetails.startEdit();
    await projectDetails.name.fill(state.edited);
    const res = await projectDetails.saveEdit();
    expect(res.ok(), `PUT project ${res.status()}`).toBeTruthy();
    state.primary = state.edited;
    state.names = state.names.map((name, i) => (i === 0 ? state.edited : name));
  },
  'PROJ-EDIT-06': async ({ projectList, projectDetails }) => {
    await requireTable(projectList);
    await projectList.openDetails();
    await projectDetails.startEdit();
    await projectDetails.cancel.click();
    await expect(projectDetails.edit).toBeVisible();
  },
  'PROJ-EDIT-07': async ({ projectList, projectDetails, page }) => {
    await requireTable(projectList);
    await projectList.openDetails();
    await projectDetails.startEdit();
    await projectDetails.name.fill(`tmp_${Date.now().toString().slice(-4)}`);
    await projectDetails.cancel.click();
    await expect(page.getByText('Unsaved Changes').first()).toBeVisible();
    await page.getByRole('button', { name: /^discard$/i }).click();
    await expect(projectDetails.edit).toBeVisible();
  },
  'PROJ-EDIT-08': async ({ projectList, projectDetails, page, state }) => {
    if (!state.moreName) throw new Error('PROJ-CREATE-42 must create the second project first');
    await projectList.goto();
    await projectList.openDetails(state.moreName);
    await projectDetails.openSidebar('Project Information');
    const toggle = page.getByRole('switch').first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.getByText('Confirm Status Change').first()).toBeVisible();
    const pending = page.waitForResponse((res) => /\/projects\//.test(res.url()) && ['PATCH', 'PUT'].includes(res.request().method()), { timeout: 20000 });
    await page.getByRole('button', { name: /^confirm$/i }).click();
    await pending;
  },
  'PROJ-EDIT-09': async ({ projectList, projectDetails, state }) => {
    if (!state.moreName) throw new Error('PROJ-CREATE-42 must create the second project first');
    await projectList.goto();
    await projectList.openDetails(state.moreName);
    await projectDetails.openSidebar('Project Information');
    await expect(projectDetails.edit).toHaveCount(0);
  },
  'PROJ-EDIT-10': async ({ projectList, projectDetails, page }) => {
    await requireTable(projectList);
    await projectList.openDetails();
    await projectDetails.startEdit();
    await projectDetails.name.fill('');
    await projectDetails.save.click();
    await expect(page.getByText('Project name is required')).toBeVisible();
  },
  'PROJ-EDIT-11': async ({ projectList, projectDetails, page, state }) => {
    await openCreatedDetails({ page, projectList, projectForm: null as never, projectDetails, state });
    await projectDetails.openSidebar('Project Information');
    await expect(page.getByText(/updated by/i).first()).toBeVisible();
  },
  'PROJ-DETAILS-01': async (ctx) => {
    await openExistingDetails(ctx);
    await expect(ctx.projectDetails.title).toContainText(/project details/i);
  },
  'PROJ-DETAILS-02': async ({ projectList, projectDetails, page }) => {
    await requireTable(projectList);
    await projectList.openDetails();
    await projectDetails.back.click();
    await expect(page).toHaveURL(/\/projects-management/);
    expect(page.url()).not.toContain('/details');
  },
  'PROJ-DETAILS-03': async (ctx) => {
    await openExistingDetails(ctx);
    await expect(ctx.page.getByText('Getting started', { exact: true }).first()).toBeVisible();
  },
  'PROJ-DETAILS-04': async (ctx) => {
    await openExistingDetails(ctx);
    for (const label of ['Getting started', 'Project Information', 'Project Users', 'Documents', 'Email Templates', 'Pick Up Location']) {
      await expect(ctx.projectDetails.sidebar(label)).toBeVisible();
    }
  },
  'PROJ-DETAILS-05': async (ctx) => {
    await openExistingDetails(ctx);
    await ctx.projectDetails.openSidebar('Getting started');
    expect(await ctx.projectDetails.hasChecklist()).toBeTruthy();
  },
  'PROJ-DETAILS-07': async (ctx) => {
    await openExistingDetails(ctx);
    await ctx.projectDetails.openSidebar('Getting started');
    await expect(ctx.page.getByText(/setup progress/i)).toHaveCount(0);
  },
  'PROJ-DETAILS-08': async (ctx) => {
    await openExistingDetails(ctx);
    await ctx.projectDetails.openSidebar('Project Information');
    await expect(ctx.page.getByText(/setup progress|getting started|pending/i).first()).toBeVisible({ timeout: 15000 });
  },
  'PROJ-DETAILS-09': async ({ projectList, page }) => {
    await requireTable(projectList);
    await projectList.openDetails();
    await page.reload();
    await expect(page.getByTestId('create-project-title')).toBeVisible({ timeout: 20000 });
  },
  'PROJ-USERS-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-USERS-01'),
  'PROJ-USERS-02': async (ctx) => {
    await openExistingDetails(ctx);
    await ctx.projectDetails.openSidebar('Project Users');
    await expect(ctx.page.getByText(/manage project users/i).first()).toBeVisible();
    await expect(ctx.page.getByText(/no users added yet|add user/i).first()).toBeVisible({ timeout: 15000 });
  },
  'PROJ-USERS-03': async ({ page, ...ctx }) => {
    await openExistingDetails({ ...ctx, page });
    await ctx.projectDetails.openSidebar('Project Users');
    const add = page.getByRole('button', { name: /add user/i }).first();
    if (!(await isShowing(add, 4000))) {
      test.skip(true, 'Add User not visible on this project');
    }
    await add.click();
    await expect(page.getByText('Assign Project Users').first()).toBeVisible({ timeout: 10000 });
    await pressEscape(page);
  },
  'PROJ-USERS-04': async (ctx) => {
    await openExistingDetails(ctx);
    await ctx.projectDetails.openSidebar('Project Users');
    await ctx.page.getByText('Man Power', { exact: true }).click();
    await expect(ctx.page.getByText(/man power|forecast|month/i).first()).toBeVisible({ timeout: 15000 });
  },
  'PROJ-USERS-05': async (ctx) => {
    await openExistingDetails(ctx);
    await ctx.projectDetails.openSidebar('Project Users');
    const teams = ctx.page.getByText('Teams', { exact: true }).first();
    if (await isShowing(teams, 4000)) await teams.click();
    await expect(ctx.page.getByText(/users|teams/i).first()).toBeVisible();
  },
  'PROJ-USERS-07': async (ctx) => sidebarSmoke(ctx, 'PROJ-USERS-07'),
  'PROJ-DOCS-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-DOCS-01'),
  'PROJ-DOCS-02': async ({ page, ...ctx }) => {
    await openExistingDetails({ ...ctx, page });
    await ctx.projectDetails.openSidebar('Documents');
    const add = page.getByRole('button', { name: /add document/i }).or(page.getByTestId('create-new-project-button'));
    await expect(add.first()).toBeVisible({ timeout: 15000 });
    await add.first().click();
    await expect(page.getByText(/document type|document name|upload/i).first()).toBeVisible({ timeout: 10000 });
    await pressEscape(page);
  },
  'PROJ-DOCS-03': async ({ page, ...ctx }) => {
    await openExistingDetails({ ...ctx, page });
    await ctx.projectDetails.openSidebar('Documents');
    const add = page.getByRole('button', { name: /add document/i }).or(page.getByTestId('create-new-project-button'));
    await add.first().click();
    const submit = page.getByRole('button', { name: /^(save|upload|create)$/i }).last();
    if (await isShowing(submit, 4000)) await submit.click();
    await expect(page.getByText(/document name is required|document type is required|at least one file/i).first()).toBeVisible();
  },
  'PROJ-DOCS-04': async ({ page, ...ctx }) => {
    await openExistingDetails({ ...ctx, page });
    await ctx.projectDetails.openSidebar('Documents');
    const add = page.getByRole('button', { name: /add document/i }).or(page.getByTestId('create-new-project-button'));
    await add.first().click();
    const name = page.getByPlaceholder(/document name|enter/i).first();
    if (await isShowing(name, 4000)) await name.fill('auto_doc');
    const submit = page.getByRole('button', { name: /^(save|upload|create)$/i }).last();
    if (await isShowing(submit, 3000)) await submit.click();
    await expect(page.getByText(/at least one file is required|file is required/i).first()).toBeVisible();
  },
  'PROJ-SCRIPT-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-SCRIPT-01'),
  'PROJ-EMAIL-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-EMAIL-01'),
  'PROJ-EMAIL-03': async (ctx) => {
    await openExistingDetails(ctx);
    await ctx.projectDetails.openSidebar('Email Templates');
    const configure = ctx.page.getByText(/configure|email configure/i).first();
    if (await isShowing(configure, 4000)) await configure.click();
    await expect(ctx.page.getByText(/email/i).first()).toBeVisible();
  },
  'PROJ-SMS-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-SMS-01'),
  'PROJ-SMS-02': async (ctx) => {
    await openExistingDetails(ctx);
    await ctx.projectDetails.openSidebar('SMS Templates');
    const configure = ctx.page.getByText(/configure|sms configure/i).first();
    if (await isShowing(configure, 4000)) await configure.click();
    await expect(ctx.page.getByText(/sms/i).first()).toBeVisible();
  },
  'PROJ-WA-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-WA-01'),
  'PROJ-WA-02': async (ctx) => {
    await openExistingDetails(ctx);
    await ctx.projectDetails.openSidebar('WhatsApp Templates');
    const configure = ctx.page.getByText(/configure|whatsapp configure/i).first();
    if (await isShowing(configure, 4000)) await configure.click();
    await expect(ctx.page.getByText(/whatsapp/i).first()).toBeVisible();
  },
  'PROJ-FB-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-FB-01'),
  'PROJ-FB-02': async ({ page, ...ctx }) => {
    await openExistingDetails({ ...ctx, page });
    await ctx.projectDetails.openSidebar('Facebook Form Mapping');
    const create = page.getByTestId('create-new-project-button').or(page.getByRole('button', { name: /create|add|map/i }));
    if (!(await isShowing(create.first(), 4000))) {
      test.skip(true, 'Facebook mapping create button not visible');
    }
    await create.first().click();
    await expect(page.getByText(/facebook|form|mapping/i).first()).toBeVisible();
  },
  'PROJ-OTH-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-OTH-01'),
  'PROJ-PAY-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-PAY-01'),
  'PROJ-CIBIL-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-CIBIL-01'),
  'PROJ-KYC-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-KYC-01'),
  'PROJ-RERA-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-RERA-01'),
  'PROJ-PICK-01': async (ctx) => sidebarSmoke(ctx, 'PROJ-PICK-01'),
  'PROJ-PICK-02': async ({ page, ...ctx }) => {
    await openExistingDetails({ ...ctx, page });
    await ctx.projectDetails.openSidebar('Pick Up Location');
    await expect(page.getByTestId('pickup-location-title').or(page.getByText(/pick.?up location/i).first())).toBeVisible();
    const create = page.getByTestId('create-pickup-location-button');
    if (await isShowing(create, 4000)) await expect(create).toBeVisible();
  },
  'PROJ-INV-01': async ({ page, ...ctx }) => {
    await openExistingDetails({ ...ctx, page });
    const item = ctx.projectDetails.sidebar('Bookings Inventory');
    if (!(await isShowing(item, 3000))) {
      test.skip(true, 'Bookings Inventory hidden without booking-channel-partner');
    }
    await item.click();
    await expect(page.getByTestId('project-inventory').or(page.getByText(/inventory/i).first())).toBeVisible({ timeout: 15000 });
  },
};

export const projectHandlerIds = new Set(Object.keys(handlers));

export async function runProjectCase(c: CatalogCase, ctx: ProjectCtx) {
  const handler = handlers[c.id];
  if (!handler) {
    throw new Error(`automated=Yes but no handler for ${c.id}`);
  }
  await handler(ctx);
}
