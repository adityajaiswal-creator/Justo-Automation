import { readFileSync } from 'node:fs';
import { chromium } from '../playwright-mcp/node_modules/playwright/index.mjs';

const LOGIN_URL = 'https://uat.manthan.justo.co.in/auth/login';
const CREATE_ROLE_URL = 'https://uat.manthan.justo.co.in/rbac-management/create-role';
const EMAIL = 'admin@idx.com';
const OTP = '456789';
const LIMIT = Number(process.env.RBAC_LIMIT || 100);
const START = Number(process.env.RBAC_START || 0);

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

async function completeOtp(page) {
  await page.getByRole('heading', { name: 'Verification code' }).waitFor({ timeout: 15000 });
  for (let i = 0; i < OTP.length; i++) {
    await page.getByTestId(`otp-input-${i + 1}`).fill(OTP[i]);
  }
  await page.getByTestId('verify-otp-button').click();
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 20000 });
}

async function login(page) {
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  if (!page.url().includes('/auth/login')) return;

  if (await page.getByTestId('otp-input-1').isVisible().catch(() => false)) {
    await completeOtp(page);
    return;
  }

  if (await page.getByTestId('identifier-input').isVisible().catch(() => false)) {
    await page.getByTestId('identifier-input').fill(EMAIL);
    await page.getByTestId('login-button').click();
    const proceed = page.getByRole('button', { name: 'Proceed to Login' });
    try {
      await proceed.waitFor({ timeout: 4000 });
      await proceed.click();
    } catch {
      /* already allowed */
    }
    await completeOtp(page);
  }
}

async function openCreateRole(page) {
  await page.goto('https://uat.manthan.justo.co.in/rbac-management', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const createBtn = page.getByTestId('create-new-role-button');
  if (await createBtn.isVisible().catch(() => false)) {
    await createBtn.click();
  } else {
    await page.goto(CREATE_ROLE_URL, { waitUntil: 'domcontentloaded' });
  }
  const leave = page.getByRole('button', { name: /leave|discard|yes/i }).first();
  try {
    await leave.waitFor({ timeout: 1500 });
    await leave.click();
  } catch {
    /* no dialog */
  }
  await page.getByTestId('role-name-input').waitFor({ timeout: 40000 });
  await page.getByPlaceholder('Search by Module', { exact: true }).waitFor({ timeout: 40000 });
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function permTestId(moduleName, permissionName) {
  const aliases = {
    'assign-all-unassign-all': 'assign-all',
  };
  const permSlug = slug(permissionName);
  return `rbac-perm-${slug(moduleName)}-${aliases[permSlug] || permSlug}`;
}

function normalizePerm(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function permissionTable(page) {
  return page
    .locator('div')
    .filter({ has: page.getByPlaceholder('Search by Module') })
    .locator('table')
    .filter({ has: page.locator('tbody [role="checkbox"]') })
    .first();
}

async function headerLabels(table) {
  const headers = table.locator('thead th');
  const headerCount = await headers.count();
  const labels = [];
  for (let i = 1; i < headerCount; i++) {
    labels.push((await headers.nth(i).innerText()).replace(/\s+/g, ' ').trim());
  }
  return labels;
}

async function clickModulePermission(page, moduleName, permissionName) {
  const search = page.getByPlaceholder('Search by Module', { exact: true });
  await search.fill('');
  await search.fill(moduleName);
  await page.waitForTimeout(400);

  const testId = permTestId(moduleName, permissionName);
  const byTestId = page.getByTestId(testId);
  if (await byTestId.count()) {
    console.log(`      click ${testId}`);
    await byTestId.scrollIntoViewIfNeeded();
    const control = byTestId.locator('[role="checkbox"]').first().or(byTestId);
    await control.click();
    return;
  }

  const table = await permissionTable(page);
  await table.waitFor({ timeout: 8000 });
  const labels = await headerLabels(table);
  const want = normalizePerm(permissionName);
  let col = labels.findIndex((label) => normalizePerm(label) === want);
  if (col < 0) {
    col = labels.findIndex((label) => {
      const got = normalizePerm(label);
      return got === want || got.replace(/or/g, '') === want.replace(/or/g, '');
    });
  }
  if (col < 0) {
    throw new Error(`Permission column not found: ${permissionName}. Headers: ${labels.join(' | ')}`);
  }
  col += 1;

  const row = table.locator('tbody tr').filter({ has: page.getByText(moduleName, { exact: true }) }).first();
  await row.waitFor({ timeout: 8000 });
  const checkbox = row.locator('td').nth(col).getByRole('checkbox');
  await checkbox.waitFor({ timeout: 8000 });
  if (await checkbox.isDisabled()) {
    throw new Error(`Permission disabled on UAT: ${moduleName} ${permissionName}`);
  }

  await checkbox.evaluate((el) => {
    const matrix = el.closest('table');
    const scroller = matrix?.parentElement;
    const thead = matrix?.querySelector('thead');
    if (!scroller || !thead) {
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      return;
    }
    const headerBottom = thead.getBoundingClientRect().bottom;
    const box = el.getBoundingClientRect();
    if (box.top < headerBottom + 10) {
      scroller.scrollTop += box.top - headerBottom - 20;
    } else {
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
    }
  });
  await page.waitForTimeout(200);
  await checkbox.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);

  if ((await checkbox.getAttribute('aria-checked')) !== 'true') {
    const box = await checkbox.boundingBox();
    if (!box) {
      throw new Error(`Permission checkbox has no position: ${moduleName} ${permissionName}`);
    }
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
  }

  if ((await checkbox.getAttribute('aria-checked')) !== 'true') {
    throw new Error(`Permission click did not check: ${moduleName} ${permissionName}`);
  }
  console.log(`      check ${moduleName}/${permissionName} col=${col}`);
}

async function saveCreatedRole(page, uniqueName, description) {
  const previewDialog = page.getByRole('dialog').filter({ hasText: 'Permission Preview' });
  if (await previewDialog.isVisible().catch(() => false)) {
    await previewDialog.getByRole('button', { name: /^close$/i }).last().click();
    await previewDialog.waitFor({ state: 'hidden', timeout: 8000 });
  }

  await page.getByTestId('role-name-input').fill(uniqueName);
  await page.getByTestId('role-description-textarea').fill(description);
  await page.getByTestId('role-name-input').blur();
  await page.getByTestId('role-description-textarea').blur();

  const footerSave = page.getByTestId('save-role-button');
  await footerSave.waitFor({ state: 'visible', timeout: 8000 });
  const debug = await page.evaluate(() => {
    const save = document.querySelector('[data-testid="save-role-button"]');
    const name = document.querySelector('[data-testid="role-name-input"]');
    const desc = document.querySelector('[data-testid="role-description-textarea"]');
    return {
      saveType: save?.getAttribute('type'),
      saveForm: save?.getAttribute('form'),
      saveDisabled: Boolean(save?.disabled),
      name: name?.value || '',
      desc: (desc?.value || '').slice(0, 60),
      formExists: Boolean(document.getElementById('create-role-form')),
      helpers: [...document.querySelectorAll('[data-testid="helper-text"]')].map((el) => el.textContent),
    };
  });
  console.log(`      save debug ${JSON.stringify(debug)}`);
  if (debug.saveDisabled) {
    throw new Error('Create Role Save stayed disabled after closing preview');
  }

  const posts = [];
  const onRequest = (req) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method())) {
      posts.push(`${req.method()} ${req.url()}`);
      console.log(`      ${req.method()} ${req.url()}`);
    }
  };
  page.on('request', onRequest);
  const saveResponse = page.waitForResponse((res) => ['POST', 'PUT'].includes(res.request().method()) && res.url().includes('roles'), {
    timeout: 40000,
  });
  await footerSave.evaluate((el) => el.click());
  console.log('      clicked Create Role Save');
  await previewDialog.waitFor({ state: 'visible', timeout: 10000 });
  const previewSave = previewDialog.getByTestId('permission-preview-save');
  await previewSave.waitFor({ state: 'attached', timeout: 8000 });
  await previewSave.evaluate((el) => el.click());
  console.log('      clicked Permission Preview Save');
  try {
    const res = await saveResponse;
    page.off('request', onRequest);
    return res;
  } catch (error) {
    page.off('request', onRequest);
    const after = await page.evaluate(() => ({
      helpers: [...document.querySelectorAll('[data-testid="helper-text"]')].map((el) => el.textContent),
      permissionError: [...document.querySelectorAll('span')].map((el) => el.textContent).find((text) => /at least one permission/i.test(text || '')),
      dialog: [...document.querySelectorAll('[role="dialog"]')].map((el) => (el.textContent || '').slice(0, 80)),
    }));
    throw new Error(`${error.message}. posts=${posts.join(' | ') || 'none'} after=${JSON.stringify(after)}`);
  }
}

const csvPath = new URL('./test-cases/rbac-create-role.csv', import.meta.url);
const cases = parseCsv(readFileSync(csvPath, 'utf8')).filter((row) => row.save === 'true');
const selected = cases.slice(START, START + LIMIT);

console.log(`Creating ${selected.length} roles from rbac-create-role.csv (start=${START} limit=${LIMIT})`);

const browser = await chromium.launch({ headless: false, channel: 'chrome', slowMo: 80 });
const page = await browser.newPage({ viewport: { width: 1680, height: 1050 } });

let passed = 0;
let failed = 0;

try {
  await login(page);
  for (const testCase of selected) {
    try {
      await openCreateRole(page);
      const uniqueName = `${testCase.roleName}_${Date.now().toString().slice(-6)}`;
      await page.getByTestId('role-name-input').fill(uniqueName);
      await page.getByTestId('role-description-textarea').fill(testCase.description || uniqueName);
      const clicks = testCase.clicks.split('|').filter(Boolean);
      for (const click of clicks) {
        const [moduleName, permissionName] = click.split(':');
        await clickModulePermission(page, moduleName.trim(), permissionName.trim());
      }
      await page.getByPlaceholder('Search by Module', { exact: true }).fill('');
      await page.getByTestId('role-name-input').blur();
      await page.getByTestId('role-description-textarea').blur();
      const res = await saveCreatedRole(page, uniqueName, testCase.description || uniqueName);
      const body = await res.text();
      if (!res.ok()) {
        throw new Error(`Create API ${res.status()}: ${body.slice(0, 240)}`);
      }
      await page.waitForTimeout(1500);
      console.log(`PASS  ${testCase.id}  ${uniqueName}`);
      passed += 1;
    } catch (error) {
      failed += 1;
      console.error(`FAIL  ${testCase.id}  ${testCase.roleName}  ->  ${error.message}`);
      await page.screenshot({ path: `e2e/rbac-fail-${testCase.id}.png`, fullPage: true }).catch(() => {});
      console.error(`      url=${page.url()}`);
    }
  }
} finally {
  console.log(`Done. pass=${passed} fail=${failed}. Browser left open.`);
}
