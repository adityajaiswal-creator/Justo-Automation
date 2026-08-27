import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';
import { env } from './config/env';

const e2eRoot = path.dirname(fileURLToPath(import.meta.url));
const headed = env.headed && !process.env.CI;

export default defineConfig({
  testDir: path.join(e2eRoot, 'specs'),
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 12_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: env.baseURL,
    channel: 'chrome',
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
      testIgnore: /auth\.setup\.ts|login\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: env.authFile },
    },
  ],
});
