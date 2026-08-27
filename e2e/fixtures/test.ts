import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { RbacRolePage } from '../pages/rbac-role.page';
import { ShiftFormPage } from '../pages/shift-form.page';
import { ShiftListPage } from '../pages/shift-list.page';
import { UserFormPage } from '../pages/user-form.page';
import { UserListPage } from '../pages/user-list.page';

type Pages = {
  loginPage: LoginPage;
  userList: UserListPage;
  userForm: UserFormPage;
  shiftList: ShiftListPage;
  shiftForm: ShiftFormPage;
  rbacRole: RbacRolePage;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  userList: async ({ page }, use) => {
    await use(new UserListPage(page));
  },
  userForm: async ({ page }, use) => {
    await use(new UserFormPage(page));
  },
  shiftList: async ({ page }, use) => {
    await use(new ShiftListPage(page));
  },
  shiftForm: async ({ page }, use) => {
    await use(new ShiftFormPage(page));
  },
  rbacRole: async ({ page }, use) => {
    await use(new RbacRolePage(page));
  },
});

export { expect } from '@playwright/test';
