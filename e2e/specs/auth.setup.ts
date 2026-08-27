import fs from 'node:fs';
import path from 'node:path';
import { test as setup } from '@playwright/test';
import { assertE2ECredentials, env } from '../config/env';
import { expectLoggedIn } from '../helpers/auth';
import { LoginPage } from '../pages/login.page';

setup('authenticate as admin via OTP', async ({ page }) => {
  assertE2ECredentials();
  fs.mkdirSync(path.dirname(env.authFile), { recursive: true });
  const login = new LoginPage(page);
  await login.loginWithOtp();
  await expectLoggedIn(page);
  await page.context().storageState({ path: env.authFile });
});
