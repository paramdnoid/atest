import { expect, test, type Page } from '@playwright/test';
import { getE2EConfig, type E2EConfig } from './helpers/env';
import { generateStableTotpCode } from './helpers/totp';
import { attachVirtualAuthenticator, detachVirtualAuthenticator, type VirtualAuthenticator } from './helpers/webauthn';

let cfg: E2EConfig;

async function openSignIn(page: Page): Promise<void> {
  await page.goto('/signin');
  await expect(page.getByRole('heading', { name: 'Anmeldung' })).toBeVisible();
}

async function fillEmail(page: Page, email: string): Promise<void> {
  await page.getByLabel('E-Mail').fill(email);
}

async function loginWithPasswordToMfaStage(page: Page): Promise<void> {
  await fillEmail(page, cfg.adminEmail);
  await page.getByLabel('Passwort').fill(cfg.adminPassword);
  await page.getByRole('button', { name: 'Mit Passwort anmelden' }).click();
  await expect(page.getByText('MFA erforderlich. Bitte Code eingeben.')).toBeVisible();
}

async function submitMfa(page: Page, code: string): Promise<void> {
  await page.getByLabel('TOTP Code').fill(code);
  await page.getByRole('button', { name: 'MFA bestaetigen' }).click();
  await expect(page.getByText('MFA bestaetigt.')).toBeVisible();
}

async function registerPasskeyAndCompleteMfa(page: Page): Promise<void> {
  await fillEmail(page, cfg.adminEmail);
  await page.getByRole('button', { name: 'Passkey registrieren' }).click();
  await expect(page.getByText('MFA erforderlich. Bitte Code eingeben.')).toBeVisible();

  const code = await generateStableTotpCode(cfg.adminTotpSecret);
  await submitMfa(page, code);
}

async function authenticateWithPasskeyToMfaStage(page: Page): Promise<void> {
  await fillEmail(page, cfg.adminEmail);
  await page.getByRole('button', { name: 'Mit Passkey anmelden' }).click();
  await expect(page.getByText('MFA erforderlich. Bitte Code eingeben.')).toBeVisible();
}

test.describe('auth webauthn + mfa step-up', () => {
  let authenticator: VirtualAuthenticator | null = null;

  test.beforeAll(() => {
    cfg = getE2EConfig();
  });

  test.beforeEach(async ({ page }) => {
    await openSignIn(page);
    authenticator = await attachVirtualAuthenticator(page);
  });

  test.afterEach(async () => {
    if (authenticator) {
      await detachVirtualAuthenticator(authenticator);
      authenticator = null;
    }
  });

  test('happy path: passkey authenticate + mfa step-up succeeds', async ({ page }) => {
    const firstCode = await generateStableTotpCode(cfg.adminTotpSecret);
    await loginWithPasswordToMfaStage(page);
    await submitMfa(page, firstCode);
    await expect(page.getByText('Access Token:')).toBeVisible();
    await expect(page.getByText('MFA-Verifikation fehlgeschlagen')).toHaveCount(0);

    await openSignIn(page);
    await registerPasskeyAndCompleteMfa(page);
    await expect(page.getByText('Access Token:')).toBeVisible();

    await openSignIn(page);
    await authenticateWithPasskeyToMfaStage(page);
    const secondCode = await generateStableTotpCode(cfg.adminTotpSecret);
    await submitMfa(page, secondCode);

    await expect(page.getByText('Access Token:')).toBeVisible();
    await expect(page.getByText('MFA-Verifikation fehlgeschlagen')).toHaveCount(0);
  });

  test('negative: passkey authenticate + invalid mfa code is rejected', async ({ page }) => {
    await registerPasskeyAndCompleteMfa(page);
    await expect(page.getByText('Access Token:')).toBeVisible();

    await openSignIn(page);
    await authenticateWithPasskeyToMfaStage(page);

    await page.getByLabel('TOTP Code').fill('000000');
    await page.getByRole('button', { name: 'MFA bestaetigen' }).click();

    await expect(page.getByText(/MFA-Verifikation fehlgeschlagen|Invalid MFA code/i)).toBeVisible();
    await expect(page.getByText('Access Token:')).toHaveCount(0);
  });
});
