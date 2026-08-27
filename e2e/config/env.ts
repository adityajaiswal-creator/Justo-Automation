import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const e2eRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(e2eRoot, '.env') });

const envName = (process.env.E2E_ENV || 'qa').toLowerCase();

const defaults: Record<string, string> = {
  qa: 'https://qa.manthan.justo.co.in',
  uat: 'https://uat.manthan.justo.co.in',
};

export const env = {
  name: envName,
  baseURL: process.env.E2E_BASE_URL || defaults[envName] || defaults.qa,
  email: process.env.E2E_EMAIL || 'admin@idx.com',
  otp: process.env.E2E_OTP || '456789',
  headed: process.env.E2E_HEADED === 'true' || process.env.E2E_HEADED === '1',
  authFile: path.join(e2eRoot, '.auth', 'user.json'),
  e2eRoot,
};
