/** Seeds the first XLSX only. After that, Excel is source of truth. Keep in sync with flow handlers. */

export const LOGIN_YES = new Set([
  'LOGIN-01',
  'LOGIN-02',
  'LOGIN-03',
  'LOGIN-04',
  'LOGIN-05',
  'LOGIN-06',
  'LOGIN-07',
]);

export const USER_YES = new Set([
  'USER-NAV-01',
  'USER-NAV-02',
  'USER-NAV-03',
  'USER-NAV-04',
  'USER-NAV-05',
  'USER-NAV-06',
  'USER-NAV-07',
  'USER-LIST-01',
  'USER-LIST-02',
  'USER-LIST-03',
  'USER-LIST-04',
  'USER-LIST-05',
  'USER-LIST-07',
  'USER-LIST-08',
  'USER-LIST-10',
  'USER-LIST-11',
  'USER-LIST-12',
  'USER-LIST-19',
  'USER-LIST-20',
  'USER-LIST-21',
  'USER-LIST-22',
  'USER-LIST-27',
  'USER-LIST-28',
  'USER-LIST-29',
  'USER-LIST-31',
  'USER-LIST-32',
  'USER-LIST-34',
  'USER-LIST-35',
  'USER-LIST-36',
  'USER-LIST-37',
  'USER-LIST-55',
  'USER-CREATE-01',
  'USER-CREATE-03',
  'USER-CREATE-04',
  'USER-CREATE-05',
  'USER-CREATE-06',
  'USER-CREATE-07',
  'USER-CREATE-08',
  'USER-CREATE-09',
  'USER-CREATE-10',
  'USER-CREATE-11',
  'USER-CREATE-12',
  'USER-CREATE-13',
  'USER-CREATE-14',
  'USER-CREATE-15',
  'USER-CREATE-16',
  'USER-CREATE-17',
  'USER-CREATE-18',
  'USER-CREATE-19',
  'USER-CREATE-21',
  'USER-CREATE-23',
  'USER-CREATE-27',
  'USER-CREATE-28',
  'USER-CREATE-31',
  'USER-CREATE-36',
  'USER-CREATE-38',
  'USER-CREATE-39',
  'USER-CREATE-40',
  'USER-CREATE-41',
  'USER-CREATE-42',
  'USER-CREATE-43',
  'USER-CREATE-46',
  'USER-CREATE-48',
  'USER-CREATE-49',
  'USER-CREATE-50',
  'USER-CREATE-62',
  'USER-CREATE-64',
  'USER-EDIT-01',
  'USER-EDIT-02',
  'USER-EDIT-03',
  'USER-EDIT-09',
  'USER-ASSIGN-01',
  'USER-ASSIGN-02',
  'USER-ASSIGN-03',
  'USER-ASSIGN-04',
  'USER-PWD-01',
  'USER-PWD-04',
  'USER-PWD-05',
  'USER-PWD-09',
  'USER-PWD-10',
  'USER-SYNC-01',
  'USER-SYNC-02',
  'USER-TEAM-01',
  'USER-TEAM-03',
  'USER-SESS-01',
]);

export const SKIP_REASON = {
  'USER-CREATE-02': 'Empty-state only; QA already has users',
  'USER-CREATE-22':
    'Needs a real user without Role read. Do not mock via localStorage. Add limited-user fixture.',
  'USER-CREATE-24':
    'Needs a real user without Shift read. Do not mock via localStorage. Add limited-user fixture.',
  'USER-CREATE-25':
    'Needs a real user without Role and Shift read. Do not mock via localStorage. Add limited-user fixture.',
  'USER-LIST-06': 'Needs a user without create permission',
  'USER-LIST-09': 'Needs a user without export permission',
  'USER-PERM-01': 'Needs a user without User read',
  'USER-PERM-02': 'Needs a user without create',
  'USER-PERM-03': 'Needs a user without edit',
  'USER-PERM-05': 'Needs a user without show-in-menu',
};

export function flagsFor(id) {
  const automated = LOGIN_YES.has(id) || USER_YES.has(id) ? 'Yes' : 'No';
  let priority = 'P2';
  if (/^(LOGIN|USER-NAV|SHIFT-NAV)/.test(id) || /CREATE-0[1-6]$/.test(id) || /CREATE-36|CREATE-37/.test(id)) {
    priority = 'P0';
  } else if (/USER-LIST-0[1-8]|USER-CREATE-|USER-EDIT-0[139]|USER-ASSIGN-01/.test(id)) {
    priority = 'P1';
  }
  const skipReason = automated === 'No' ? SKIP_REASON[id] || 'Not automated yet' : '';
  return { automated, priority, skipReason };
}
