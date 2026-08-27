import type { Page } from '@playwright/test';
import { expect } from '../fixtures/test';
import { loadCatalog, type CatalogCase } from '../helpers/catalog';
import type { RbacRolePage } from '../pages/rbac-role.page';

export type RbacCtx = {
  page: Page;
  rbacRole: RbacRolePage;
};

function parseClicks(clicks: string) {
  return clicks
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [moduleName, permissionName] = part.split(':');
      return { moduleName: moduleName.trim(), permissionName: permissionName.trim() };
    });
}

function parseExpected(expected: string) {
  return expected
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const [moduleName, perms] = part.split(':');
      return (perms || '')
        .split('+')
        .map((permissionName) => permissionName.trim())
        .filter(Boolean)
        .map((permissionName) => ({ moduleName: moduleName.trim(), permissionName }));
    });
}

async function runRoleCase(c: CatalogCase, { page, rbacRole }: RbacCtx) {
  await rbacRole.gotoCreate();
  const stamp = Date.now().toString().slice(-6);
  const name = `${c.roleName || 'auto_rbac'}_${stamp}`.slice(0, 90);
  await rbacRole.name.fill(c.roleName ? name : '');
  await rbacRole.description.fill(c.description || name);
  for (const click of parseClicks(c.clicks || '')) {
    await rbacRole.clickPermission(click.moduleName, click.permissionName);
  }
  await rbacRole.moduleSearch.fill('');
  if (c.expected) {
    const sample = parseExpected(c.expected).slice(0, 4);
    for (const perm of sample) {
      await rbacRole.expectPermissionChecked(perm.moduleName, perm.permissionName);
    }
  }
  const saveThis = c.id === 'RBAC-ROLE-001' || process.env.E2E_RBAC_SAVE === 'true';
  if (c.save === 'true' && saveThis) {
    const res = await rbacRole.saveRole(name, c.description || name);
    expect(res.ok(), `roles API ${res.status()}`).toBeTruthy();
    await expect(page).not.toHaveURL(/\/create-role/, { timeout: 20000 });
  }
}

const handlers: Record<string, (ctx: RbacCtx) => Promise<void>> = {
  'RBAC-UI-01': async ({ page, rbacRole }) => {
    await rbacRole.gotoCreate();
    await expect(page).toHaveURL(/\/rbac-management\/create-role/);
    await expect(rbacRole.title.or(page.getByText('Create Role').first())).toBeVisible();
    await expect(rbacRole.save).toBeDisabled();
  },
  'RBAC-UI-02': async ({ rbacRole, page }) => {
    await rbacRole.gotoCreate();
    await rbacRole.description.fill('test');
    await rbacRole.clickPermission('User', 'Read All');
    await rbacRole.name.fill('');
    await rbacRole.name.blur();
    await expect(page.getByText(/Role name is required/i)).toBeVisible();
    await expect(rbacRole.save).toBeDisabled();
  },
  'RBAC-UI-03': async ({ rbacRole, page }) => {
    await rbacRole.gotoCreate();
    await rbacRole.name.fill('auto_no_perm');
    await rbacRole.description.fill('');
    await rbacRole.description.blur();
    await expect(page.getByText(/Description is required/i)).toBeVisible();
    await expect(rbacRole.save).toBeDisabled();
  },
  'RBAC-UI-04': async ({ rbacRole, page }) => {
    await rbacRole.gotoCreate();
    await rbacRole.name.fill('auto_no_perm');
    await rbacRole.description.fill('no permissions selected');
    await rbacRole.save.click();
    await expect(page.getByText(/At least one permission must be selected/i)).toBeVisible();
  },
};

for (const c of loadCatalog('rbac-create-role')) {
  if (c.id.startsWith('RBAC-ROLE-') && !handlers[c.id]) {
    handlers[c.id] = (ctx) => runRoleCase(c, ctx);
  }
}

export const rbacHandlerIds = new Set(Object.keys(handlers));

export async function runRbacCase(c: CatalogCase, ctx: RbacCtx) {
  const handler = handlers[c.id];
  if (!handler) {
    throw new Error(`automated=Yes but no handler for ${c.id}`);
  }
  await handler(ctx);
}
