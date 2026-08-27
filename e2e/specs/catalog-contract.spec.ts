import { test, expect } from '../fixtures/test';
import { loadCatalog } from '../helpers/catalog';
import { loginHandlerIds } from '../flows/login.handlers';
import { rbacHandlerIds } from '../flows/rbac.handlers';
import { projectHandlerIds } from '../flows/project-management.handlers';
import { shiftHandlerIds } from '../flows/shift-management.handlers';
import { userHandlerIds } from '../flows/user-management.handlers';
import { BACKEND_MODULES } from '../rbac/rules.mjs';

test.describe('Catalog contract', () => {
  test('login automated cases have handlers', () => {
    const missing = loadCatalog('login')
      .filter((c) => c.automated === 'Yes' && !loginHandlerIds.has(c.id))
      .map((c) => c.id);
    expect(missing, `Missing login handlers: ${missing.join(', ')}`).toEqual([]);
  });

  test('user automated cases have handlers', () => {
    const missing = loadCatalog('user-management')
      .filter((c) => c.automated === 'Yes' && !userHandlerIds.has(c.id))
      .map((c) => c.id);
    expect(missing, `Missing user handlers: ${missing.join(', ')}`).toEqual([]);
  });

  test('shift automated cases have handlers', () => {
    const missing = loadCatalog('shift-management')
      .filter((c) => c.automated === 'Yes' && !shiftHandlerIds.has(c.id))
      .map((c) => c.id);
    expect(missing, `Missing shift handlers: ${missing.join(', ')}`).toEqual([]);
  });

  test('project automated cases have handlers', () => {
    const missing = loadCatalog('project-management')
      .filter((c) => c.automated === 'Yes' && !projectHandlerIds.has(c.id))
      .map((c) => c.id);
    expect(missing, `Missing project handlers: ${missing.join(', ')}`).toEqual([]);
  });

  test('rbac automated cases have handlers', () => {
    const missing = loadCatalog('rbac-create-role')
      .filter((c) => c.automated === 'Yes' && !rbacHandlerIds.has(c.id))
      .map((c) => c.id);
    expect(missing, `Missing rbac handlers: ${missing.join(', ')}`).toEqual([]);
  });

  test('rbac module catalog matches backend enum', () => {
    const names = loadCatalog('rbac-modules').map((row) => row.name);
    expect(names).toEqual(BACKEND_MODULES.map(([, name]) => name));
  });
});
