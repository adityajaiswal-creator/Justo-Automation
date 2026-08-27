import { env } from '../config/env';
import { test } from '../fixtures/test';
import { catalogAnnotations, loadCatalog, uniqueUser } from '../helpers/catalog';
import { runUserCase, type UserRunState } from '../flows/user-management.handlers';
import { UserListPage } from '../pages/user-list.page';

const cases = loadCatalog('user-management');

const mutating = new Set([
  'USER-CREATE-36',
  'USER-CREATE-38',
  'USER-NAV-03',
  'USER-EDIT-01',
  'USER-EDIT-02',
  'USER-EDIT-03',
  'USER-EDIT-09',
  'USER-NAV-04',
  'USER-ASSIGN-01',
  'USER-ASSIGN-02',
  'USER-ASSIGN-03',
  'USER-ASSIGN-04',
]);

function addCase(c: (typeof cases)[number], state: UserRunState) {
  test(`${c.id} — ${c.title}`, { tag: '@user' }, async ({ page, userList, userForm }) => {
    test.info().annotations.push(...catalogAnnotations(c, { env: env.name }));
    if (c.automated !== 'Yes') {
      test.skip(true, c.skipReason || 'Not automated yet');
    }
    await runUserCase(c, { page, userList, userForm, state });
  });
}

test.describe('User Management', () => {
  test.describe.configure({ mode: 'parallel' });
  const state: UserRunState = {
    createdEmail: '',
    createdName: '',
    unique: uniqueUser(),
  };
  for (const c of cases.filter((row) => !mutating.has(row.id))) {
    addCase(c, state);
  }
});

test.describe('User Management mutating flows', () => {
  test.describe.configure({ mode: 'serial' });
  const state: UserRunState = {
    createdEmail: '',
    createdName: '',
    unique: uniqueUser(),
  };

  for (const c of cases.filter((row) => mutating.has(row.id))) {
    addCase(c, state);
  }

  test.afterAll(async ({ browser }) => {
    if (!state.createdName) return;
    const context = await browser.newContext({ storageState: env.authFile, baseURL: env.baseURL });
    const page = await context.newPage();
    try {
      const userList = new UserListPage(page);
      await userList.goto();
      await userList.deactivateRow(state.createdName);
    } finally {
      await context.close();
    }
  });
});
