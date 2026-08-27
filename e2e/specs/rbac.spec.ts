import { env } from '../config/env';
import { test } from '../fixtures/test';
import { catalogAnnotations, loadCatalog } from '../helpers/catalog';
import { runRbacCase } from '../flows/rbac.handlers';

const cases = loadCatalog('rbac-create-role');

test.describe('RBAC create role', () => {
  test.describe.configure({ mode: 'serial' });

  for (const c of cases) {
    test(`${c.id} — ${c.roleName || c.title || c.expectedResult || c.id}`, { tag: '@rbac' }, async ({ page, rbacRole }) => {
      test.info().annotations.push(
        ...catalogAnnotations(
          {
            ...c,
            title: c.roleName || c.title || c.id,
            expected: c.expectedResult || c.expected,
            automated: c.automated || 'Yes',
          },
          { env: env.name },
        ),
      );
      if (c.automated && c.automated !== 'Yes') {
        test.skip(true, c.skipReason || 'Not automated yet');
      }
      await runRbacCase(c, { page, rbacRole });
    });
  }
});
