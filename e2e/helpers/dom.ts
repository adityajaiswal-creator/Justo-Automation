import type { Locator, Page } from '@playwright/test';

export async function isShowing(locator: Locator, timeout = 2000) {
  try {
    await locator.waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

export async function clickIfVisible(locator: Locator, timeout = 2000) {
  if (!(await isShowing(locator, timeout))) return false;
  await locator.click();
  return true;
}

export async function pressEscape(page: Page) {
  await page.keyboard.press('Escape');
}

export async function dismissDiscardDialog(page: Page) {
  await clickIfVisible(page.getByRole('button', { name: /^discard$/i }), 1500);
}
