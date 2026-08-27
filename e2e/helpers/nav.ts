import type { Page } from '@playwright/test';

export async function gotoPath(page: Page, path: string, attempts = 3) {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      return;
    } catch (error) {
      lastError = error;
      if (i === attempts) break;
      await page.waitForTimeout(1000);
    }
  }
  throw lastError;
}
