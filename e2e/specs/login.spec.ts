import { env } from '../config/env';
import { test, expect } from '../fixtures/test';
import { loadCatalog } from '../helpers/catalog';

const cases = loadCatalog('login');

test.describe('Login', () => {
  for (const c of cases) {
    test(`${c.id} — ${c.title}`, async ({ page, loginPage }) => {
      test.info().annotations.push(
        { type: 'priority', description: c.priority || 'P0' },
        { type: 'env', description: env.name },
      );
      if (c.automated !== 'Yes') {
        test.skip(true, c.skipReason || 'Not automated yet');
      }

      switch (c.id) {
        case 'LOGIN-01': {
          await loginPage.open();
          await expect(loginPage.identifier).toBeVisible();
          await expect(loginPage.sendOtp).toBeVisible();
          await expect(loginPage.passwordLink).toBeVisible();
          break;
        }
        case 'LOGIN-02': {
          await loginPage.open();
          await expect(loginPage.sendOtp).toBeDisabled();
          break;
        }
        case 'LOGIN-03': {
          await loginPage.open();
          await loginPage.passwordLink.click();
          await expect(loginPage.passwordEmail).toBeVisible();
          await expect(loginPage.passwordField).toBeVisible();
          await expect(loginPage.passwordSubmit).toBeVisible();
          await expect(loginPage.backToOtp).toBeVisible();
          break;
        }
        case 'LOGIN-04': {
          await loginPage.open();
          await loginPage.passwordLink.click();
          await loginPage.passwordEmail.fill(env.email);
          await loginPage.passwordField.fill(env.otp);
          await loginPage.passwordSubmit.click();
          await expect(page.getByRole('alert').filter({ hasText: 'Login via Email/Password is not allowed' })).toBeVisible({
            timeout: 15000,
          });
          await expect(page).toHaveURL(/\/auth\/login/);
          break;
        }
        case 'LOGIN-05': {
          await loginPage.open();
          await loginPage.passwordLink.click();
          await expect(loginPage.passwordEmail).toBeVisible();
          await loginPage.backToOtp.click();
          await expect(loginPage.identifier).toBeVisible();
          await expect(loginPage.sendOtp).toBeVisible();
          break;
        }
        case 'LOGIN-06': {
          await loginPage.open();
          await loginPage.identifier.fill(env.email);
          await loginPage.sendOtp.click();
          await loginPage.dismissNotificationDialog();
          await expect(loginPage.verificationHeading).toBeVisible({ timeout: 15000 });
          await expect(page.getByText(env.email).first()).toBeVisible();
          await expect(loginPage.verifyButton).toBeDisabled();
          break;
        }
        case 'LOGIN-07': {
          await loginPage.loginWithOtp();
          await expect(page).not.toHaveURL(/\/auth\/login/);
          break;
        }
        default:
          throw new Error(`No handler for ${c.id}`);
      }
    });
  }
});
