/**
 * Source of truth for RBAC create-role automation.
 * Rules copied from justo-manthan-frontend/src/pages/rbac/hooks/dependencyRules.ts
 * Module ids from justo-manthan-backend/src/constants/enum.ts Resource.
 */
export const normalizeKey = (value = '') => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const BACKEND_MODULES = [
  [1, 'User'],
  [2, 'Role'],
  [3, 'Lead'],
  [4, 'Project'],
  [5, 'Campaign'],
  [6, 'Shift'],
  [7, 'Team'],
  [8, 'Pipeline'],
  [9, 'Task'],
  [10, 'Note'],
  [11, 'Site Visit'],
  [12, 'Import Export'],
  [13, 'Scoring'],
  [14, 'Routing'],
  [15, 'Channel Partner'],
  [16, 'Portal Management'],
  [17, 'Token Management'],
  [18, 'Driver Management'],
  [19, 'Pickup Request Management'],
  [20, 'Kyc'],
  [21, 'Cheque Clearance'],
  [22, 'Cti Config'],
  [23, 'Leadgen Connector'],
  [24, 'Opportunity'],
  [25, 'Contact'],
  [26, 'Custom Attribute'],
  [27, 'GRE Walk In Visitors'],
  [28, 'Custom Layout'],
  [29, 'User Announcement'],
  [30, 'AI Prompt'],
  [31, 'Dashboard'],
  [32, 'Dashboard Report'],
  [33, 'Booking Management'],
  [34, 'Geo Location'],
  [35, 'Presales Dashboard'],
  [36, 'CP Meeting'],
  [37, 'Master Setting'],
  [38, 'Project Daily Report'],
  [39, 'Inventory'],
  [40, 'Inventory Booking'],
  [41, 'User Adaptation Report'],
];

const MODULE_ALIAS = {
  notes: 'Note',
  tasks: 'Task',
  sitevisit: 'Site Visit',
  customfield: 'Custom Attribute',
  customlayout: 'Custom Layout',
  channelpartner: 'Channel Partner',
  importexport: 'Import Export',
  cticonfig: 'Cti Config',
  kyc: 'Kyc',
  dashboardreport: 'Dashboard Report',
  bookingmanagement: 'Booking Management',
  geolocation: 'Geo Location',
  portalmanagement: 'Portal Management',
  drivermanagement: 'Driver Management',
  contact: 'Contact',
};

export function moduleLabel(name) {
  const key = normalizeKey(name);
  if (MODULE_ALIAS[key]) return MODULE_ALIAS[key];
  const hit = BACKEND_MODULES.find(([, n]) => normalizeKey(n) === key);
  return hit ? hit[1] : name;
}

/** Human permission -> typical API/UI labels used in the matrix */
export const PERM_LABEL = {
  create: 'Create',
  read: 'Read',
  readall: 'Read All',
  edit: 'Edit',
  editall: 'Edit All',
  delete: 'Delete',
  deleteall: 'Delete All',
  activateordeactivate: 'Activate Or Deactivate',
  assignunassign: 'Assign/Unassign',
  assignallunassignall: 'Assign All/Unassign All',
  reassign: 'Reassign',
  bulkactions: 'Bulk Actions',
  import: 'Import',
  export: 'Export',
  call: 'Call',
  communication: 'Communication',
  bulkcommunication: 'Bulk Communication',
  piidata: 'Pii Data',
};

export function permLabel(name) {
  return PERM_LABEL[normalizeKey(name)] || name;
}

const r = (module, perms) => {
  const out = {};
  for (const [perm, spec] of Object.entries(perms)) {
    out[normalizeKey(perm)] = {
      sameModule: (spec.sameModule || []).map(permLabel),
      otherModules: Object.fromEntries(
        Object.entries(spec.otherModules || {}).map(([mod, list]) => [normalizeKey(mod), list.map(permLabel)]),
      ),
    };
  }
  return [normalizeKey(module), out];
};

export const DEPENDENCY_RULES = Object.fromEntries([
  r('User', {
    Create: { sameModule: ['Read', 'Activate Or Deactivate', 'Assign/Unassign', 'Assign All/Unassign All'], otherModules: { Role: ['Read'], Shift: ['Read'] } },
    ReadAll: { sameModule: ['Read'] },
    Edit: { sameModule: ['Read', 'Activate Or Deactivate', 'Assign/Unassign'] },
    EditAll: { sameModule: ['Read All', 'Activate Or Deactivate', 'Assign All/Unassign All', 'Edit'] },
    Delete: { sameModule: ['Read'] },
    DeleteAll: { sameModule: ['Read All', 'Delete'] },
    'Activate Or Deactivate': { sameModule: ['Read', 'Read All'] },
    'Assign/Unassign': { sameModule: ['Read'] },
    'Assign All/Unassign All': { sameModule: ['Read All'] },
  }),
  r('Role', {
    Create: { sameModule: ['Read'] },
    ReadAll: { sameModule: ['Read'] },
    Edit: { sameModule: ['Read'] },
    EditAll: { sameModule: ['Read All', 'Edit'] },
  }),
  r('Lead', {
    Create: {
      sameModule: ['Read'],
      otherModules: {
        Project: ['Read'], Campaign: ['Read'], Pipeline: ['Read'], User: ['Read'],
        'Site visit': ['Read'], Notes: ['Read'], Tasks: ['Read'],
        'Custom field': ['Read All'], 'Custom layout': ['Read All'], 'Channel Partner': ['Read All'],
      },
    },
    ReadAll: { sameModule: ['Read'], otherModules: { 'Custom field': ['Read All'], 'Custom layout': ['Read All'] } },
    Edit: { sameModule: ['Read', 'Pii Data', 'Edit'], otherModules: { 'Custom field': ['Read All'], 'Custom layout': ['Read All'], 'Channel Partner': ['Read All'] } },
    EditAll: { sameModule: ['Read All', 'Pii Data', 'Edit'], otherModules: { 'Custom field': ['Read All'], 'Custom layout': ['Read All'] } },
    Delete: { sameModule: ['Read'], otherModules: { 'Custom field': ['Read All'], 'Custom layout': ['Read All'] } },
    DeleteAll: { sameModule: ['Read All', 'Delete'], otherModules: { 'Custom field': ['Read All'], 'Custom layout': ['Read All'] } },
    Reassign: { sameModule: ['Edit'] },
    'Assign All/Unassign All': { sameModule: ['Read All'] },
    Import: { sameModule: ['Read'], otherModules: { 'Import Export': ['Read'] } },
    Export: { sameModule: ['Read'], otherModules: { 'Import Export': ['Read'] } },
    Call: { sameModule: ['Read'] },
    Communication: { sameModule: ['Read'] },
    'Bulk Communication': { sameModule: ['Read'] },
    'Bulk Actions': { sameModule: ['Edit All', 'Edit'] },
    'Pii Data': { sameModule: ['Read'] },
  }),
  r('Project', {
    Create: { sameModule: ['Read', 'Activate Or Deactivate'], otherModules: { User: ['Read'], Team: ['Read'] } },
    ReadAll: { sameModule: ['Read'] },
    Edit: { sameModule: ['Read', 'Activate Or Deactivate'] },
    EditAll: { sameModule: ['Read All', 'Activate Or Deactivate', 'Edit'] },
    Delete: { sameModule: ['Read'] },
    DeleteAll: { sameModule: ['Read All', 'Delete'] },
    'Activate Or Deactivate': { sameModule: ['Read', 'Read All', 'Edit'] },
    'Assign/Unassign': { sameModule: ['Read', 'Edit'] },
    'Assign All/Unassign All': { sameModule: ['Read', 'Read All', 'Edit All'] },
  }),
  r('Campaign', {
    Create: { sameModule: ['Read', 'Activate Or Deactivate'] },
    ReadAll: { sameModule: ['Read'] },
    Edit: { sameModule: ['Read', 'Activate Or Deactivate'] },
    EditAll: { sameModule: ['Read All', 'Activate Or Deactivate', 'Edit'] },
    Delete: { sameModule: ['Read'] },
    DeleteAll: { sameModule: ['Read All', 'Delete'] },
    'Activate Or Deactivate': { sameModule: ['Read', 'Read All'] },
  }),
  r('Shift', {
    Create: { sameModule: ['Read'], otherModules: { User: ['Read'] } },
    ReadAll: { sameModule: ['Read'] },
    Edit: { sameModule: ['Read'] },
    EditAll: { sameModule: ['Read All', 'Edit'] },
    Delete: { sameModule: ['Read'] },
    DeleteAll: { sameModule: ['Read All', 'Delete'] },
  }),
  r('Team', {
    Create: { sameModule: ['Read'], otherModules: { User: ['Read'] } },
    ReadAll: { sameModule: ['Read'] },
    Edit: { sameModule: ['Read'] },
    EditAll: { sameModule: ['Read All', 'Edit'] },
    Delete: { sameModule: ['Read'] },
    DeleteAll: { sameModule: ['Read All', 'Delete'] },
    'Activate Or Deactivate': { sameModule: ['Read', 'Read All'] },
    'Assign/Unassign': { sameModule: ['Read', 'Edit'] },
    'Assign All/Unassign All': { sameModule: ['Read All', 'Edit All'] },
  }),
  r('Pipeline', {
    Create: { sameModule: ['Read'] },
    ReadAll: { sameModule: ['Read'] },
    Edit: { sameModule: ['Read'] },
    EditAll: { sameModule: ['Read All', 'Edit'] },
    Delete: { sameModule: ['Read'] },
    DeleteAll: { sameModule: ['Read All', 'Delete'] },
    'Activate Or Deactivate': { sameModule: ['Read', 'Read All'] },
    'Assign/Unassign': { sameModule: ['Read', 'Edit'] },
    'Assign All/Unassign All': { sameModule: ['Read All', 'Edit All'] },
  }),
  r('Task', {
    Create: { sameModule: ['Read', 'Assign/Unassign'], otherModules: { Project: ['Read'], Lead: ['Read'], User: ['Read'] } },
    ReadAll: { sameModule: ['Read'] },
    Edit: { sameModule: ['Read', 'Assign/Unassign'] },
    EditAll: { sameModule: ['Read All', 'Assign All/Unassign All', 'Edit'] },
    Delete: { sameModule: ['Read'] },
    DeleteAll: { sameModule: ['Read All', 'Delete'] },
    'Assign/Unassign': { sameModule: ['Read', 'Edit'] },
    'Assign All/Unassign All': { sameModule: ['Read All', 'Edit All'] },
  }),
  r('Note', {
    Create: { sameModule: ['Read'], otherModules: { Lead: ['Read'] } },
    ReadAll: { sameModule: ['Read'] },
    Edit: { sameModule: ['Read'] },
    EditAll: { sameModule: ['Read All', 'Edit'] },
    Delete: { sameModule: ['Read'] },
    DeleteAll: { sameModule: ['Read All', 'Delete'] },
  }),
  r('Site Visit', {
    Create: { sameModule: ['Read'], otherModules: { Lead: ['Read'] } },
    ReadAll: { sameModule: ['Read'] },
    Edit: { sameModule: ['Read'] },
    EditAll: { sameModule: ['Read All', 'Edit'] },
    Delete: { sameModule: ['Read'] },
    DeleteAll: { sameModule: ['Read All', 'Delete'] },
  }),
  r('Import Export', {
    Import: { sameModule: ['Read', 'Read All'] },
    Export: { sameModule: ['Read', 'Read All'] },
  }),
  r('Opportunity', {
    Create: {
      sameModule: ['Read'],
      otherModules: {
        Project: ['Read'], Campaign: ['Read'], Pipeline: ['Read'], User: ['Read'],
        'Site visit': ['Read'], Notes: ['Read'], Tasks: ['Read'],
        'Custom field': ['Read All'], 'Custom layout': ['Read All'], 'Channel Partner': ['Read All'],
      },
    },
    ReadAll: { sameModule: ['Read'], otherModules: { 'Custom field': ['Read All'], 'Custom layout': ['Read All'] } },
    Edit: { sameModule: ['Read', 'Pii Data', 'Edit'], otherModules: { 'Custom field': ['Read All'], 'Custom layout': ['Read All'], 'Channel Partner': ['Read All'] } },
    EditAll: { sameModule: ['Read All', 'Pii Data', 'Edit'], otherModules: { 'Custom field': ['Read All'], 'Custom layout': ['Read All'] } },
  }),
]);

function ensureModule(state, moduleName) {
  const label = moduleLabel(moduleName);
  if (!state[label]) state[label] = new Set();
  return state[label];
}

function addPerm(state, moduleName, permName) {
  const set = ensureModule(state, moduleName);
  set.add(permLabel(permName));
  if (normalizeKey(permName) === 'readall') set.add('Read');
}

export function applyClick(state, moduleName, permName) {
  const moduleKey = normalizeKey(moduleName);
  const permKey = normalizeKey(permName);
  addPerm(state, moduleName, permName);
  const rules = DEPENDENCY_RULES[moduleKey]?.[permKey];
  if (!rules) return state;
  for (const dep of rules.sameModule || []) addPerm(state, moduleName, dep);
  for (const [depMod, deps] of Object.entries(rules.otherModules || {})) {
    for (const dep of deps) addPerm(state, depMod, dep);
  }
  if (permKey === 'reassign') {
    addPerm(state, moduleName, 'Bulk Actions');
    const bulkRules = DEPENDENCY_RULES[moduleKey]?.[normalizeKey('Bulk Actions')];
    for (const dep of bulkRules?.sameModule || []) addPerm(state, moduleName, dep);
  }
  if (permKey === 'bulkactions') addPerm(state, moduleName, 'Reassign');
  return state;
}

export function applyClicks(clicks) {
  const state = {};
  for (const { module, permission } of clicks) applyClick(state, module, permission);
  return state;
}

export function formatExpected(state) {
  return Object.entries(state)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mod, perms]) => `${mod}:${[...perms].sort().join('+')}`)
    .join('|');
}

export function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
}
