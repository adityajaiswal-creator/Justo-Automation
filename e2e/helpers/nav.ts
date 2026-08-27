import { expect, type Page } from '@playwright/test';

export async function gotoPath(page: Page, path: string) {
  await expect(async () => {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    if (response && response.status() >= 500) {
      throw new Error(`GET ${path} returned ${response.status()}`);
    }
  }).toPass({ timeout: 30_000, intervals: [500, 1000, 2000] });
}
