import { expect, type Page } from '@playwright/test';

/** Authenticated chrome after OTP — sidebar is icon-only, so do not require module links. */
export async function expectLoggedIn(page: Page) {
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 15000 });
}
