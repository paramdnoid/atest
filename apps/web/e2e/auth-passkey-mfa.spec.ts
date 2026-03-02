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
  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill('');
  await emailInput.type(email, { delay: 20 });
  await expect(page.getByRole('button', { name: 'Mit Passkey anmelden' })).toBeEnabled({ timeout: 10_000 });
}

async function loginWithPasswordToMfaStage(page: Page): Promise<void> {
  await fillEmail(page, cfg.adminEmail);
  await page.locator('input[type="password"]').fill(cfg.adminPassword);
  await page.getByRole('button', { name: 'Mit Passwort anmelden' }).click();

  const mfaStatus = page.getByText('MFA erforderlich. Bitte Code eingeben.');
  const errorText = page.locator('p.text-red-600');

  await Promise.race([
    mfaStatus.waitFor({ state: 'visible', timeout: 15_000 }),
    errorText.waitFor({ state: 'visible', timeout: 15_000 })
  ]);

  if (await errorText.isVisible()) {
    const message = (await errorText.textContent())?.trim() ?? 'unknown login error';
    throw new Error(`Credential login did not reach MFA stage: ${message}`);
  }

  await expect(mfaStatus).toBeVisible();
}

async function submitMfaAndExpectDashboard(page: Page, code: string): Promise<void> {
  await page.locator('input[placeholder="123456"]').fill(code);
  await page.getByRole('button', { name: 'MFA bestätigen' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

async function registerPasskeyAndCompleteMfa(page: Page): Promise<void> {
  await fillEmail(page, cfg.adminEmail);
  const registerButton = page.getByRole('button', { name: 'Passkey registrieren' });
  await expect(registerButton).toBeEnabled({ timeout: 10_000 });
  await registerButton.click();
  await expect(page.getByText('MFA erforderlich. Bitte Code eingeben.')).toBeVisible();

  const code = await generateStableTotpCode(cfg.adminTotpSecret);
  await submitMfaAndExpectDashboard(page, code);
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

  test('happy path: password login + mfa → passkey register + mfa → passkey auth + mfa', async ({ page }) => {
    // Step 1: Password login with MFA step-up
    const firstCode = await generateStableTotpCode(cfg.adminTotpSecret);
    await loginWithPasswordToMfaStage(page);
    await submitMfaAndExpectDashboard(page, firstCode);

    // Step 2: Register passkey with MFA step-up
    await openSignIn(page);
    await registerPasskeyAndCompleteMfa(page);

    // Step 3: Authenticate with registered passkey + MFA step-up
    await openSignIn(page);
    await authenticateWithPasskeyToMfaStage(page);
    const secondCode = await generateStableTotpCode(cfg.adminTotpSecret);
    await submitMfaAndExpectDashboard(page, secondCode);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('MFA-Verifikation fehlgeschlagen')).toHaveCount(0);
  });

  test('negative: invalid mfa code is rejected, stays on signin', async ({ page }) => {
    // Register passkey first (requires MFA step-up)
    await registerPasskeyAndCompleteMfa(page);

    // Navigate back to signin and authenticate with passkey
    await openSignIn(page);
    await authenticateWithPasskeyToMfaStage(page);

    // Submit invalid TOTP code
    await page.locator('input[placeholder="123456"]').fill('000000');
    await page.getByRole('button', { name: 'MFA bestätigen' }).click();

    await expect(page.getByText(/MFA-Verifikation fehlgeschlagen|Invalid MFA code/i)).toBeVisible();
    await expect(page).toHaveURL(/\/signin/);
  });
});
