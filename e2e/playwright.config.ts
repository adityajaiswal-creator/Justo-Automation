import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';
import { env } from './config/env';

const e2eRoot = path.dirname(fileURLToPath(import.meta.url));
const headed = env.headed && !process.env.CI;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: path.join(e2eRoot, 'specs'),
  fullyParallel: true,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 12_000 },
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }], ['github']]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: env.baseURL,
    ...(env.channel ? { channel: env.channel as 'chrome' | 'msedge' } : {}),
    headless: !headed,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'contract',
      testMatch: /catalog-contract\.spec\.ts/,
    },
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'login',
      testMatch: /login\.spec\.ts/,
      use: { storageState: { cookies: [], origins: [] } },
    },
    {
      name: 'qa',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /auth\.setup\.ts|login\.spec\.ts|catalog-contract\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: env.authFile },
    },
  ],
});
