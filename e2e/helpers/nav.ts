import type { Page } from '@playwright/test';

export async function gotoPath(page: Page, path: string, attempts = 3) {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i += 1) {
    if (page.isClosed()) {
      throw lastError ?? new Error(`Page closed before GET ${path}`);
    }
    try {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      if (response && response.status() >= 500) {
        throw new Error(`GET ${path} returned ${response.status()}`);
      }
      return;
    } catch (error) {
      lastError = error;
      if (i === attempts || page.isClosed()) break;
    }
  }
  throw lastError;
}
