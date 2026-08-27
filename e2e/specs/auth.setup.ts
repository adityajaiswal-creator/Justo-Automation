import fs from 'node:fs';
import path from 'node:path';
import { expect, test as setup } from '@playwright/test';
import { env } from '../config/env';
import { LoginPage } from '../pages/login.page';

setup('authenticate as admin via OTP', async ({ page }) => {
  fs.mkdirSync(path.dirname(env.authFile), { recursive: true });
  const login = new LoginPage(page);
  await login.loginWithOtp();
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await page.context().storageState({ path: env.authFile });
});
