#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function handlerIds(file) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  return new Set([...src.matchAll(/^\s+'([A-Z0-9-]+)': async/gm)].map((m) => m[1]));
}

function catalog(name) {
  return JSON.parse(fs.readFileSync(path.join(root, 'data/generated', `${name}.json`), 'utf8'));
}

function assertNoMissing(label, cases, ids) {
  const missing = cases.filter((c) => c.automated === 'Yes' && !ids.has(c.id)).map((c) => c.id);
  if (missing.length) {
    throw new Error(`${label} automated cases missing handlers: ${missing.join(', ')}`);
  }
}

const loginIds = handlerIds('flows/login.handlers.ts');
const userIds = handlerIds('flows/user-management.handlers.ts');
const shiftIds = handlerIds('flows/shift-management.handlers.ts');
const projectIds = handlerIds('flows/project-management.handlers.ts');
const rbacIds = handlerIds('flows/rbac.handlers.ts');

assertNoMissing('login', catalog('login'), loginIds);
assertNoMissing('user', catalog('user-management'), userIds);
assertNoMissing('shift', catalog('shift-management'), shiftIds);
assertNoMissing('project', catalog('project-management'), projectIds);
assertNoMissing(
  'rbac-ui',
  catalog('rbac-create-role').filter((c) => String(c.id).startsWith('RBAC-UI-')),
  rbacIds,
);

const rbacSrc = fs.readFileSync(path.join(root, 'flows/rbac.handlers.ts'), 'utf8');
if (!rbacSrc.includes("startsWith('RBAC-ROLE-')")) {
  throw new Error('Missing generic RBAC-ROLE handler registration');
}

console.log(
  `Catalog contract ok (${loginIds.size} login, ${userIds.size} user, ${shiftIds.size} shift, ${projectIds.size} project, ${rbacIds.size} rbac UI handlers)`,
);
