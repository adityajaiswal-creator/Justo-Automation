import { expect, type Locator, type Page } from '@playwright/test';
import { env, assertE2ECredentials } from '../config/env';
import { isShowing } from '../helpers/dom';

export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly identifier: Locator;
  readonly sendOtp: Locator;
  readonly passwordLink: Locator;
  readonly passwordEmail: Locator;
  readonly passwordField: Locator;
  readonly passwordSubmit: Locator;
  readonly backToOtp: Locator;
  readonly verifyButton: Locator;
  readonly verificationHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Secure Login' });
    this.identifier = page.getByTestId('identifier-input');
    this.sendOtp = page.getByTestId('login-button');
    this.passwordLink = page.getByTestId('login-with-password-link');
    this.passwordEmail = page.getByTestId('email-password-email');
    this.passwordField = page.getByTestId('email-password-password');
    this.passwordSubmit = page.getByTestId('login-password-button');
    this.backToOtp = page.getByTestId('back-to-otp-login');
    this.verifyButton = page.getByTestId('verify-otp-button');
    this.verificationHeading = page.getByRole('heading', { name: 'Verification code' });
  }

  otpBox(index: number) {
    return this.page.getByTestId(`otp-input-${index}`);
  }

  async open() {
    await this.page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await expect(this.heading).toBeVisible();
  }

  async dismissNotificationDialog() {
    const proceed = this.page.getByRole('button', { name: 'Proceed to Login' });
    if (await isShowing(proceed, 4000)) {
      await proceed.click();
    }
  }

  async fillOtp(otp = env.otp) {
    await expect(this.verificationHeading).toBeVisible({ timeout: 15000 });
    for (let i = 0; i < otp.length; i += 1) {
      await this.otpBox(i + 1).fill(otp[i]);
    }
  }

  async loginWithOtp(email = env.email, otp = env.otp) {
    assertE2ECredentials();
    await this.page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await expect(this.heading.or(this.otpBox(1)).or(this.identifier).first()).toBeVisible({ timeout: 20000 });

    if (!this.page.url().includes('/auth/login')) return;

    if (await isShowing(this.otpBox(1), 2000)) {
      await this.fillOtp(otp);
      await this.verifyButton.click();
      await this.page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 20000 });
      return;
    }

    await expect(this.identifier).toBeVisible({ timeout: 15000 });
    await this.identifier.fill(email);
    await this.sendOtp.click();
    await this.dismissNotificationDialog();
    await this.fillOtp(otp);
    await this.verifyButton.click();
    await this.page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 20000 });
  }
}
