import { expect, test, type Page } from '@playwright/test';
import { getE2EConfig, type E2EConfig } from './helpers/env';
import { flushRateLimits } from './helpers/flush-rate-limits';
import { generateStableTotpCode } from './helpers/totp';
import { attachVirtualAuthenticator, detachVirtualAuthenticator, type VirtualAuthenticator } from './helpers/webauthn';
import { openModuleRouteIfAvailable } from './helpers/workflow';

let cfg: E2EConfig;

async function openSignIn(page: Page): Promise<void> {
  await page.goto('/signin');
  await expect(page.getByRole('heading', { name: 'Willkommen zurück.' })).toBeVisible();
}

async function loginWithPasswordToMfaStage(page: Page): Promise<'dashboard' | 'mfa'> {
  await page.locator('input[type="email"]').fill(cfg.adminEmail);
  await page.locator('input[type="password"]').fill(cfg.adminPassword);
  await page.getByRole('button', { name: 'Anmelden' }).click();

  const nextStep = await Promise.any([
    page.waitForURL('**/dashboard', { timeout: 15_000 }).then(() => 'dashboard' as const),
    page
      .getByLabel('Authenticator-Code')
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => 'mfa' as const),
  ]);

  return nextStep;
}

async function submitMfaAndExpectDashboard(page: Page, code: string): Promise<void> {
  await page.locator('input[placeholder="000000"]').fill(code);
  await page.getByRole('button', { name: 'Bestätigen' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

async function loginWithPasswordAndMfa(page: Page): Promise<void> {
  await openSignIn(page);
  const nextStep = await loginWithPasswordToMfaStage(page);
  if (nextStep === 'mfa') {
    const code = await generateStableTotpCode(cfg.adminTotpSecret);
    await submitMfaAndExpectDashboard(page, code);
    return;
  }
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

test.describe('auth webauthn + mfa step-up', () => {
  let authenticator: VirtualAuthenticator | null = null;

  test.beforeAll(() => {
    cfg = getE2EConfig();
  });

  test.beforeEach(async ({ page }) => {
    flushRateLimits();
    await openSignIn(page);
    authenticator = await attachVirtualAuthenticator(page);
  });

  test.afterEach(async () => {
    if (authenticator) {
      await detachVirtualAuthenticator(authenticator);
      authenticator = null;
    }
  });

  test('happy path: password login + mfa führt ins Dashboard', async ({ page }) => {
    const nextStep = await loginWithPasswordToMfaStage(page);
    if (nextStep === 'mfa') {
      const code = await generateStableTotpCode(cfg.adminTotpSecret);
      await submitMfaAndExpectDashboard(page, code);
    } else {
      await page.waitForURL('**/dashboard', { timeout: 15_000 });
    }

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('MFA-Verifikation fehlgeschlagen')).toHaveCount(0);
  });

  test('negative: ungültiger mfa code wird abgelehnt', async ({ page }) => {
    const nextStep = await loginWithPasswordToMfaStage(page);
    test.skip(nextStep !== 'mfa', 'MFA ist fuer diesen Account nicht aktiv; negativer MFA-Test nicht anwendbar.');
    await page.locator('input[placeholder="000000"]').fill('111111');
    await page.getByRole('button', { name: 'Bestätigen' }).click();

    await expect(page.getByText(/MFA-Verifikation fehlgeschlagen|Invalid MFA code/i)).toBeVisible();
    await expect(page).toHaveURL(/\/signin/);
  });

  test('passkey registrierung aus Einstellungen ist erreichbar', async ({ page }) => {
    await loginWithPasswordAndMfa(page);
    const settingsAvailable = await openModuleRouteIfAvailable(page, {
      linkName: 'Einstellungen',
      route: '/settings',
      headingName: 'Einstellungen',
    });
    test.skip(!settingsAvailable, 'Einstellungen-Modul ist fuer dieses Profil nicht sichtbar.');

    const registerPasskeyButton = page.getByRole('button', { name: 'Neuen Passkey registrieren' });
    await expect(registerPasskeyButton).toBeVisible();
    await expect(registerPasskeyButton).toBeEnabled();
    await registerPasskeyButton.click();

    await expect(
      page.getByText(/Passkey erfolgreich registriert\.|Passkey-Registrierung fehlgeschlagen\./i),
    ).toBeVisible({ timeout: 15_000 });
  });
});
