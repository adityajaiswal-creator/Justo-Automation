import type { Page } from '@playwright/test';
import { assertE2ECredentials, env } from '../config/env';
import { expect } from '../fixtures/test';
import type { CatalogCase } from '../helpers/catalog';
import type { LoginPage } from '../pages/login.page';

type LoginCtx = {
  page: Page;
  loginPage: LoginPage;
};

const handlers: Record<string, (ctx: LoginCtx) => Promise<void>> = {
  'LOGIN-01': async ({ loginPage }) => {
    await loginPage.open();
    await expect(loginPage.identifier).toBeVisible();
    await expect(loginPage.sendOtp).toBeVisible();
    await expect(loginPage.passwordLink).toBeVisible();
  },
  'LOGIN-02': async ({ loginPage }) => {
    await loginPage.open();
    await expect(loginPage.sendOtp).toBeDisabled();
  },
  'LOGIN-03': async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.passwordLink.click();
    await expect(loginPage.passwordEmail).toBeVisible();
    await expect(loginPage.passwordField).toBeVisible();
    await expect(loginPage.passwordSubmit).toBeVisible();
    await expect(loginPage.backToOtp).toBeVisible();
  },
  'LOGIN-04': async ({ page, loginPage }) => {
    await loginPage.open();
    await loginPage.passwordLink.click();
    await loginPage.passwordEmail.fill(env.email);
    await loginPage.passwordField.fill(env.otp);
    await loginPage.passwordSubmit.click();
    await expect(page.getByRole('alert').filter({ hasText: 'Login via Email/Password is not allowed' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page).toHaveURL(/\/auth\/login/);
  },
  'LOGIN-05': async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.passwordLink.click();
    await expect(loginPage.passwordEmail).toBeVisible();
    await loginPage.backToOtp.click();
    await expect(loginPage.identifier).toBeVisible();
    await expect(loginPage.sendOtp).toBeVisible();
  },
  'LOGIN-06': async ({ page, loginPage }) => {
    await loginPage.open();
    await loginPage.identifier.fill(env.email);
    await loginPage.sendOtp.click();
    await loginPage.dismissNotificationDialog();
    await expect(loginPage.verificationHeading).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(env.email).first()).toBeVisible();
    await expect(loginPage.verifyButton).toBeDisabled();
  },
  'LOGIN-07': async ({ page, loginPage }) => {
    await loginPage.loginWithOtp();
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.getByTestId('users-link')).toBeVisible({ timeout: 15000 });
  },
};

export const loginHandlerIds = new Set(Object.keys(handlers));

export async function runLoginCase(c: CatalogCase, ctx: LoginCtx) {
  assertE2ECredentials();
  const handler = handlers[c.id];
  if (!handler) {
    throw new Error(`automated=Yes but no handler for ${c.id}`);
  }
  await handler(ctx);
}
