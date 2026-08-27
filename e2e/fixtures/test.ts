import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { UserFormPage } from '../pages/user-form.page';
import { UserListPage } from '../pages/user-list.page';

type Pages = {
  loginPage: LoginPage;
  userList: UserListPage;
  userForm: UserFormPage;
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
});

export { expect } from '@playwright/test';
