import { test, expect } from '../fixtures/test';
import { loadCatalog } from '../helpers/catalog';
import { loginHandlerIds } from '../flows/login.handlers';
import { userHandlerIds } from '../flows/user-management.handlers';

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

  test('user handlers are marked automated in the catalog', () => {
    const byId = new Map(loadCatalog('user-management').map((c) => [c.id, c]));
    const drift = [...userHandlerIds].filter((id) => byId.get(id)?.automated !== 'Yes');
    expect(drift, `Handler without automated=Yes: ${drift.join(', ')}`).toEqual([]);
  });
});
