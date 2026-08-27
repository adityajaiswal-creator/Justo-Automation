import { env } from '../config/env';
import { test } from '../fixtures/test';
import { catalogAnnotations, loadCatalog, uniqueShift } from '../helpers/catalog';
import { runShiftCase, type ShiftRunState } from '../flows/shift-management.handlers';
import { ShiftListPage } from '../pages/shift-list.page';

const cases = loadCatalog('shift-management');
const unique = uniqueShift();

const mutating = new Set([
  'SHIFT-CREATE-11',
  'SHIFT-CREATE-12',
  'SHIFT-CREATE-13',
  'SHIFT-CREATE-14',
  'SHIFT-EDIT-01',
  'SHIFT-EDIT-02',
  'SHIFT-EDIT-03',
  'SHIFT-EDIT-04',
  'SHIFT-EDIT-05',
  'SHIFT-EDIT-06',
  'SHIFT-EDIT-07',
  'SHIFT-EDIT-08',
  'SHIFT-EDIT-09',
  'SHIFT-CLONE-01',
  'SHIFT-CLONE-02',
  'SHIFT-DELETE-01',
  'SHIFT-DELETE-02',
  'SHIFT-DELETE-03',
]);

function addCase(c: (typeof cases)[number], state: ShiftRunState) {
  test(`${c.id} — ${c.title}`, { tag: '@shift' }, async ({ page, shiftList, shiftForm }) => {
    test.info().annotations.push(...catalogAnnotations(c, { env: env.name }));
    if (c.automated !== 'Yes') {
      test.skip(true, c.skipReason || 'Not automated yet');
    }
    await runShiftCase(c, { page, shiftList, shiftForm, state });
  });
}

test.describe('Shift Management', () => {
  test.describe.configure({ mode: 'parallel' });
  const state: ShiftRunState = {
    stamp: unique.stamp,
    names: [],
    primary: '',
    weekdays: unique.weekdays,
    night: unique.night,
    clone: unique.clone,
  };
  for (const c of cases.filter((row) => !mutating.has(row.id))) {
    addCase(c, state);
  }
});

test.describe('Shift Management mutating flows', () => {
  test.describe.configure({ mode: 'serial' });
  const state: ShiftRunState = {
    stamp: unique.stamp,
    names: [],
    primary: unique.name,
    weekdays: unique.weekdays,
    night: unique.night,
    clone: unique.clone,
  };

  for (const c of cases.filter((row) => mutating.has(row.id))) {
    addCase(c, state);
  }

  test.afterAll(async ({ browser }) => {
    if (!state.names.length) return;
    const context = await browser.newContext({ storageState: env.authFile, baseURL: env.baseURL });
    const page = await context.newPage();
    try {
      const shiftList = new ShiftListPage(page);
      await shiftList.goto();
      for (const name of [...state.names].reverse()) {
        await shiftList.removeShift(name).catch(() => false);
      }
    } finally {
      await context.close();
    }
  });
});
