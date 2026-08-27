import { test } from '../fixtures/test';
import { loadCatalog, uniqueUser } from '../helpers/catalog';
import { runUserCase, type UserRunState } from '../flows/user-management.handlers';

const cases = loadCatalog('user-management');
const state: UserRunState = {
  createdEmail: '',
  createdName: '',
  knownSearch: '',
  unique: uniqueUser(),
};

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

function addCase(c: (typeof cases)[number]) {
  test(`${c.id} — ${c.title}`, async ({ page, userList, userForm }) => {
    test.info().annotations.push(
      { type: 'priority', description: c.priority || 'P2' },
      { type: 'automated', description: c.automated },
    );
    if (c.automated !== 'Yes') {
      test.skip(true, c.skipReason || 'Not automated yet');
    }
    await runUserCase(c, { page, userList, userForm, state });
  });
}

test.describe('User Management', () => {
  for (const c of cases.filter((row) => !mutating.has(row.id))) {
    addCase(c);
  }
});

test.describe('User Management mutating flows', () => {
  test.describe.configure({ mode: 'serial' });
  for (const c of cases.filter((row) => mutating.has(row.id))) {
    addCase(c);
  }
});

