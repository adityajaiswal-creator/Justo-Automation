import { writeFileSync } from 'node:fs';
import { BACKEND_MODULES, applyClicks, formatExpected, slug, DEPENDENCY_RULES, permLabel } from './rbac/rules.mjs';

const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

const rows = [];
const add = (row) => rows.push(row);

add({
  id: 'RBAC-UI-01',
  type: 'ui',
  save: 'false',
  roleName: '',
  description: '',
  clicks: '',
  expected: '',
  expectedResult: 'Open /rbac-management/create-role; title Create Role; Save disabled until name, description, and at least one permission',
});
add({
  id: 'RBAC-UI-02',
  type: 'ui',
  save: 'false',
  roleName: '',
  description: 'test',
  clicks: 'User:Read All',
  expected: 'User:Read+Read All',
  expectedResult: 'Empty role name shows Role name is required; save stays disabled',
});
add({
  id: 'RBAC-UI-03',
  type: 'ui',
  save: 'false',
  roleName: 'auto_no_perm',
  description: '',
  clicks: '',
  expected: '',
  expectedResult: 'Empty description shows Description is required; save stays disabled',
});
add({
  id: 'RBAC-UI-04',
  type: 'ui',
  save: 'false',
  roleName: 'auto_no_perm',
  description: 'no permissions selected',
  clicks: '',
  expected: '',
  expectedResult: 'Save with zero permissions shows At least one permission must be selected',
});

let n = 1;
const pushRole = (type, clicks, note) => {
  if (clicks.some((c) => UAT_SKIP_CLICKS.has(`${c.module}:${c.permission}`))) return;
  const expectedState = applyClicks(clicks);
  const expected = formatExpected(expectedState);
  const clickStr = clicks.map((c) => `${c.module}:${c.permission}`).join('|');
  const roleName = `auto_rbac_${String(n).padStart(3, '0')}_${clicks.map((c) => `${slug(c.module)}_${slug(c.permission)}`).join('_')}`.slice(0, 90);
  add({
    id: `RBAC-ROLE-${String(n).padStart(3, '0')}`,
    type,
    save: 'true',
    roleName,
    description: note,
    clicks: clickStr,
    expected,
    expectedResult: 'Role is created; list shows the new role; selected permissions include dependencyRules auto-grants',
  });
  n += 1;
};

/** Permissions that are disabled or missing on UAT User module — do not generate cases for these. */
const UAT_SKIP_CLICKS = new Set([
  'User:Edit',
  'User:Delete',
  'User:Delete All',
  'User:Activate Or Deactivate',
  'User:Assign/Unassign',
  'User:Assign All/Unassign All',
]);

const USER_ACTIONS = [
  'Create',
  'Read All',
  'Edit',
  'Edit All',
  'Delete',
  'Delete All',
  'Activate Or Deactivate',
  'Assign/Unassign',
  'Assign All/Unassign All',
].filter((permission) => !UAT_SKIP_CLICKS.has(`User:${permission}`));
const LEAD_ACTIONS = [
  'Create',
  'Read All',
  'Edit',
  'Edit All',
  'Delete',
  'Delete All',
  'Reassign',
  'Import',
  'Export',
  'Call',
  'Communication',
  'Bulk Communication',
  'Bulk Actions',
  'Pii Data',
];

for (const u of USER_ACTIONS) {
  pushRole('user', [{ module: 'User', permission: u }], `User Management only: click User ${u}; assert dependencyRules auto-selects`);
}
for (const l of LEAD_ACTIONS) {
  pushRole('lead', [{ module: 'Lead', permission: l }], `Lead Management only: click Lead ${l}; assert dependencyRules auto-selects`);
}

for (const u of USER_ACTIONS) {
  for (const l of LEAD_ACTIONS) {
    if (n > 130) break;
    pushRole(
      'user+lead',
      [
        { module: 'User', permission: u },
        { module: 'Lead', permission: l },
      ],
      `Permutation User ${u} + Lead ${l} with full dependencyRules expansion`,
    );
  }
}

const extras = [
  [{ module: 'Project', permission: 'Create' }],
  [{ module: 'Campaign', permission: 'Create' }],
  [{ module: 'Pipeline', permission: 'Create' }],
  [{ module: 'Task', permission: 'Create' }],
  [{ module: 'Note', permission: 'Create' }],
  [{ module: 'Site Visit', permission: 'Create' }],
  [{ module: 'Team', permission: 'Create' }],
  [{ module: 'Shift', permission: 'Create' }],
  [{ module: 'Role', permission: 'Create' }],
  [{ module: 'Opportunity', permission: 'Create' }],
  [
    { module: 'User', permission: 'Create' },
    { module: 'Lead', permission: 'Create' },
    { module: 'Project', permission: 'Create' },
  ],
  [
    { module: 'User', permission: 'Create' },
    { module: 'Lead', permission: 'Create' },
    { module: 'Task', permission: 'Create' },
  ],
  [
    { module: 'Lead', permission: 'Create' },
    { module: 'Note', permission: 'Create' },
    { module: 'Site Visit', permission: 'Create' },
  ],
];
for (const clicks of extras) {
  pushRole('combo', clicks, `Extra module combo: ${clicks.map((c) => `${c.module} ${c.permission}`).join(' + ')}`);
}

const header = ['id', 'type', 'save', 'roleName', 'description', 'clicks', 'expected', 'expectedResult'];
const csv = [header.join(','), ...rows.map((row) => header.map((key) => csvEscape(row[key])).join(','))].join('\n');
writeFileSync(new URL('./test-cases/rbac-create-role.csv', import.meta.url), `${csv}\n`);

const modulesCsv = ['id,name,source\n', ...BACKEND_MODULES.map(([id, name]) => `${id},${csvEscape(name)},backend Resource enum\n`)].join('');
writeFileSync(new URL('./test-cases/rbac-modules.csv', import.meta.url), modulesCsv);

console.log(`Wrote ${rows.length} RBAC cases (save=true: ${rows.filter((r) => r.save === 'true').length})`);
console.log(`Backend modules: ${BACKEND_MODULES.length}`);
console.log(`Dependency rule modules: ${Object.keys(DEPENDENCY_RULES).length}`);
console.log(`Sample expected for User Create + Lead Create:\n${formatExpected(applyClicks([{ module: 'User', permission: 'Create' }, { module: 'Lead', permission: 'Create' }]))}`);
void permLabel;
void slug;
