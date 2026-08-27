import { chromium } from '../playwright-mcp/node_modules/playwright/index.mjs';

const LOGIN_URL = 'https://uat.manthan.justo.co.in/auth/login';
const EMAIL = 'admin@idx.com';
const PASSWORD = '456789';
const OTP = '456789';

function pass(id, title) {
  console.log(`PASS  ${id}  ${title}`);
}

function fail(id, title, reason) {
  console.error(`FAIL  ${id}  ${title}  ->  ${reason}`);
  throw new Error(`${id}: ${reason}`);
}

const browser = await chromium.launch({
  headless: false,
  channel: 'chrome',
  slowMo: 400,
});

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

try {
  // LOGIN-01
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Secure Login' }).waitFor();
  if (!(await page.getByTestId('identifier-input').isVisible())) {
    fail('LOGIN-01', 'Open UAT login page', 'Email field missing');
  }
  if (!(await page.getByTestId('login-button').isVisible())) {
    fail('LOGIN-01', 'Open UAT login page', 'Send OTP missing');
  }
  if (!(await page.getByTestId('login-with-password-link').isVisible())) {
    fail('LOGIN-01', 'Open UAT login page', 'Password link missing');
  }
  pass('LOGIN-01', 'Open UAT login page');

  // LOGIN-02
  if (!(await page.getByTestId('login-button').isDisabled())) {
    fail('LOGIN-02', 'Send OTP stays disabled when field is empty', 'Send OTP was enabled');
  }
  pass('LOGIN-02', 'Send OTP stays disabled when field is empty');

  // LOGIN-03
  await page.getByTestId('login-with-password-link').click();
  await page.getByTestId('email-password-email').waitFor();
  if (!(await page.getByTestId('email-password-password').isVisible())) {
    fail('LOGIN-03', 'Switch to email and password login', 'Password field missing');
  }
  if (!(await page.getByTestId('back-to-otp-login').isVisible())) {
    fail('LOGIN-03', 'Switch to email and password login', 'Back to OTP missing');
  }
  pass('LOGIN-03', 'Switch to email and password login');

  // LOGIN-04
  await page.getByTestId('email-password-email').fill(EMAIL);
  await page.getByTestId('email-password-password').fill(PASSWORD);
  await page.getByTestId('login-password-button').click();
  const blocked = page.getByRole('alert').filter({
    hasText: 'Login via Email/Password is not allowed',
  });
  await blocked.waitFor({ timeout: 15000 });
  if (!page.url().includes('/auth/login')) {
    fail('LOGIN-04', 'Password login is blocked for OTP-only account', page.url());
  }
  pass('LOGIN-04', 'Password login is blocked for OTP-only account');

  // LOGIN-05
  await page.getByTestId('back-to-otp-login').click();
  await page.getByTestId('identifier-input').waitFor();
  if (!(await page.getByTestId('login-button').isVisible())) {
    fail('LOGIN-05', 'Back to OTP login', 'OTP form not shown');
  }
  pass('LOGIN-05', 'Back to OTP login');

  // LOGIN-06
  await page.getByTestId('identifier-input').fill(EMAIL);
  await page.getByTestId('login-button').click();
  const proceed = page.getByRole('button', { name: 'Proceed to Login' });
  try {
    await proceed.waitFor({ timeout: 4000 });
    await proceed.click();
  } catch {
    // Dialog may not appear if notifications were already allowed.
  }
  await page.getByRole('heading', { name: 'Verification code' }).waitFor({ timeout: 15000 });
  const sentTo = await page.getByText('admin@idx.com').first().isVisible();
  if (!sentTo) {
    fail('LOGIN-06', 'Send OTP with valid email', 'Email not shown on verification screen');
  }
  if (!(await page.getByTestId('verify-otp-button').isDisabled())) {
    fail('LOGIN-06', 'Send OTP with valid email', 'Verify & login should be disabled');
  }
  pass('LOGIN-06', 'Send OTP with valid email');

  // LOGIN-07 — always enter fixed OTP 456789
  for (let i = 0; i < OTP.length; i++) {
    await page.getByTestId(`otp-input-${i + 1}`).fill(OTP[i]);
  }
  await page.getByTestId('verify-otp-button').click();
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 20000 });
  pass('LOGIN-07', `Valid OTP logs user into UAT -> ${page.url()}`);
  console.log('Browser left open so you can watch the logged-in app.');
} catch (error) {
  console.error(error.message);
  await page.screenshot({ path: 'e2e/last-failure.png', fullPage: true });
  console.error('Saved screenshot: e2e/last-failure.png');
  process.exitCode = 1;
}
