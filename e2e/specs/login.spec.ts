import { env } from '../config/env';
import { test } from '../fixtures/test';
import { catalogAnnotations, loadCatalog } from '../helpers/catalog';
import { runLoginCase } from '../flows/login.handlers';

const cases = loadCatalog('login');

test.describe('Login', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const c of cases) {
    test(`${c.id} — ${c.title}`, { tag: '@login' }, async ({ page, loginPage }) => {
      test.info().annotations.push(...catalogAnnotations(c, { env: env.name }));
      if (c.automated !== 'Yes') {
        test.skip(true, c.skipReason || 'Not automated yet');
      }
      await runLoginCase(c, { page, loginPage });
    });
  }
});
