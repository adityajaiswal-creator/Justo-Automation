import { expect, type Page } from '@playwright/test';
import { dismissDiscardDialog, isShowing } from '../helpers/dom';
import { gotoPath } from '../helpers/nav';

function slug(value: string) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function permTestId(moduleName: string, permissionName: string) {
  const aliases: Record<string, string> = { 'assign-all-unassign-all': 'assign-all' };
  const permSlug = slug(permissionName);
  return `rbac-perm-${slug(moduleName)}-${aliases[permSlug] || permSlug}`;
}

export class RbacRolePage {
  readonly page: Page;
  readonly name: ReturnType<Page['getByTestId']>;
  readonly description: ReturnType<Page['getByTestId']>;
  readonly save: ReturnType<Page['getByTestId']>;
  readonly moduleSearch: ReturnType<Page['getByPlaceholder']>;
  readonly title: ReturnType<Page['getByRole']>;

  constructor(page: Page) {
    this.page = page;
    this.name = page.getByTestId('role-name-input');
    this.description = page.getByTestId('role-description-textarea');
    this.save = page.getByTestId('save-role-button');
    this.moduleSearch = page.getByPlaceholder('Search by Module', { exact: true });
    this.title = page.getByRole('heading', { name: /create role/i });
  }

  async gotoCreate() {
    await gotoPath(this.page, '/rbac-management');
    const createBtn = this.page
      .getByTestId('create-new-role-button')
      .or(this.page.getByRole('button', { name: /create (new )?role/i }));
    if (await isShowing(createBtn.first(), 8000)) {
      await createBtn.first().click();
    } else {
      await gotoPath(this.page, '/rbac-management/create-role');
    }
    await dismissDiscardDialog(this.page);
    await expect(this.name).toBeVisible({ timeout: 40000 });
    await expect(this.moduleSearch).toBeVisible({ timeout: 40000 });
  }

  async clickPermission(moduleName: string, permissionName: string) {
    await this.moduleSearch.fill(moduleName);
    const byTestId = this.page.getByTestId(permTestId(moduleName, permissionName));
    if (await byTestId.count()) {
      await byTestId.scrollIntoViewIfNeeded();
      const control = byTestId.getByRole('checkbox').first().or(byTestId);
      await control.click();
      return;
    }
    const table = this.page
      .locator('div')
      .filter({ has: this.moduleSearch })
      .locator('table')
      .filter({ has: this.page.locator('tbody [role="checkbox"]') })
      .first();
    await expect(table).toBeVisible({ timeout: 8000 });
    const headers = table.locator('thead th');
    const headerCount = await headers.count();
    const want = permissionName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let col = -1;
    for (let i = 1; i < headerCount; i += 1) {
      const label = (await headers.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      const got = label.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (got === want || got.replace(/or/g, '') === want.replace(/or/g, '')) {
        col = i;
        break;
      }
    }
    if (col < 0) {
      throw new Error(`Permission column not found: ${permissionName}`);
    }
    const row = table.locator('tbody tr').filter({ has: this.page.getByText(moduleName, { exact: true }) }).first();
    const checkbox = row.locator('td').nth(col).getByRole('checkbox');
    await expect(checkbox).toBeVisible();
    if (await checkbox.isDisabled()) {
      throw new Error(`Permission disabled: ${moduleName} ${permissionName}`);
    }
    await checkbox.click();
  }

  async expectPermissionChecked(moduleName: string, permissionName: string) {
    await this.moduleSearch.fill(moduleName);
    const byTestId = this.page.getByTestId(permTestId(moduleName, permissionName));
    const checkbox = (await byTestId.count())
      ? byTestId.getByRole('checkbox').first().or(byTestId)
      : this.page.locator(`[role="checkbox"]`).filter({ hasText: permissionName }).first();
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  }

  async saveRole(uniqueName: string, description: string) {
    const preview = this.page.getByRole('dialog').filter({ hasText: 'Permission Preview' });
    if (await isShowing(preview, 1000)) {
      await preview.getByRole('button', { name: /^close$/i }).last().click();
    }
    await this.name.fill(uniqueName);
    await this.description.fill(description);
    await this.name.blur();
    await expect(this.save).toBeEnabled();
    const saveResponse = this.page.waitForResponse(
      (res) => ['POST', 'PUT'].includes(res.request().method()) && res.url().includes('roles'),
      { timeout: 40000 },
    );
    await this.save.click();
    if (await isShowing(preview, 10000)) {
      await preview.getByTestId('permission-preview-save').click();
    }
    return saveResponse;
  }
}
