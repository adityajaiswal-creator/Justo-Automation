import type { Page } from '@playwright/test';
import { dismissDiscardDialog, isShowing } from './dom';

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

export function pathnameOf(page: Page) {
  try {
    const { pathname } = new URL(page.url());
    return pathname.replace(/\/$/, '') || '/';
  } catch {
    return '';
  }
}

function targetPath(path: string) {
  return path.split('?')[0].replace(/\/$/, '') || '/';
}

/** Stay on the current SPA session. Only document-goto when the route actually changed. */
export async function ensurePath(page: Page, path: string, attempts = 3) {
  const target = targetPath(path);
  const current = pathnameOf(page);
  if (current === target) return;

  if (target === '/projects-management' && current.startsWith('/projects-management/')) {
    const back = page.getByTestId('cancel-project-button');
    if (await isShowing(back, 1500)) {
      await back.click();
      await dismissDiscardDialog(page);
      if (pathnameOf(page) === '/projects-management') return;
    }
  }

  if (target === '/projects-management/create' && current === '/projects-management') {
    const create = page.getByTestId('create-new-project-button');
    if (await isShowing(create, 1500)) {
      await create.click();
      if (pathnameOf(page) === '/projects-management/create') return;
    }
  }

  await gotoPath(page, path, attempts);
}
