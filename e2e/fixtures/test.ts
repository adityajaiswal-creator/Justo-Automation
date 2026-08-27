import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { ProjectDetailsPage } from '../pages/project-details.page';
import { ProjectFormPage } from '../pages/project-form.page';
import { ProjectListPage } from '../pages/project-list.page';
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
  projectList: ProjectListPage;
  projectForm: ProjectFormPage;
  projectDetails: ProjectDetailsPage;
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
  projectList: async ({ page }, use) => {
    await use(new ProjectListPage(page));
  },
  projectForm: async ({ page }, use) => {
    await use(new ProjectFormPage(page));
  },
  projectDetails: async ({ page }, use) => {
    await use(new ProjectDetailsPage(page));
  },
  rbacRole: async ({ page }, use) => {
    await use(new RbacRolePage(page));
  },
});

export { expect } from '@playwright/test';
