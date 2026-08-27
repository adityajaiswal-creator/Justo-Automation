import type { Page } from '@playwright/test';
import { env } from '../config/env';
import { test as base } from '../fixtures/test';
import { catalogAnnotations, loadCatalog, uniqueProject } from '../helpers/catalog';
import { runProjectCase, type ProjectRunState } from '../flows/project-management.handlers';
import { ProjectDetailsPage } from '../pages/project-details.page';
import { ProjectFormPage } from '../pages/project-form.page';
import { ProjectListPage } from '../pages/project-list.page';

const cases = loadCatalog('project-management');
const unique = uniqueProject();

const mutatingOrder = [
  'PROJ-CREATE-41',
  'PROJ-CREATE-43',
  'PROJ-CREATE-42',
  'PROJ-EDIT-05',
  'PROJ-EDIT-11',
  'PROJ-LIST-22',
  'PROJ-EDIT-08',
  'PROJ-EDIT-09',
];
const mutating = new Set(mutatingOrder);

type Session = {
  page: Page;
  projectList: ProjectListPage;
  projectForm: ProjectFormPage;
  projectDetails: ProjectDetailsPage;
};

const test = base.extend<object, { session: Session }>({
  session: [
    async ({ browser }, use) => {
      const context = await browser.newContext({
        storageState: env.authFile,
        baseURL: env.baseURL,
        viewport: { width: 1440, height: 900 },
      });
      const page = await context.newPage();
      await use({
        page,
        projectList: new ProjectListPage(page),
        projectForm: new ProjectFormPage(page),
        projectDetails: new ProjectDetailsPage(page),
      });
      await context.close();
    },
    { scope: 'worker' },
  ],
});

test.describe.configure({ mode: 'serial' });

function addCase(c: (typeof cases)[number], state: ProjectRunState) {
  test(`${c.id} — ${c.title}`, { tag: '@project' }, async ({ session }) => {
    test.info().annotations.push(...catalogAnnotations(c, { env: env.name }));
    if (c.automated !== 'Yes') {
      test.skip(true, c.skipReason || 'Not automated yet');
    }
    await runProjectCase(c, { ...session, state });
  });
}

test.describe('Project Management', () => {
  const state: ProjectRunState = {
    stamp: unique.stamp,
    names: [],
    codes: [],
    primary: '',
    primaryCode: '',
    moreName: unique.moreName,
    moreCode: unique.moreCode,
    edited: unique.edited,
  };
  for (const c of cases.filter((row) => !mutating.has(row.id))) {
    addCase(c, state);
  }
});

test.describe('Project Management mutating flows', () => {
  const state: ProjectRunState = {
    stamp: unique.stamp,
    names: [],
    codes: [],
    primary: unique.name,
    primaryCode: unique.code,
    moreName: unique.moreName,
    moreCode: unique.moreCode,
    edited: unique.edited,
  };

  for (const id of mutatingOrder) {
    const c = cases.find((row) => row.id === id);
    if (c) addCase(c, state);
  }

  test.afterAll(async ({ session }) => {
    if (!state.names.length) return;
    const { page, projectList } = session;
    await projectList.goto();
    for (const name of [...state.names].reverse()) {
      await projectList.searchFor(name).catch(() => undefined);
      const row = projectList.row(name);
      if (!(await row.isVisible().catch(() => false))) continue;
      const toggle = row.locator('#switch-button button, #switch-button [role="switch"]').first();
      if (!(await toggle.isVisible().catch(() => false))) continue;
      const pressed = await toggle.getAttribute('aria-checked').catch(() => null);
      if (pressed === 'false') continue;
      await toggle.click();
      const confirm = page.getByRole('button', { name: /^confirm$/i });
      if (await confirm.isVisible().catch(() => false)) await confirm.click();
    }
  });
});
