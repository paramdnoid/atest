import { expect, test, type Page } from '@playwright/test';
import { getE2EConfig, type E2EConfig } from './helpers/env';
import { generateStableTotpCode } from './helpers/totp';
import { attachVirtualAuthenticator, detachVirtualAuthenticator, type VirtualAuthenticator } from './helpers/webauthn';

let cfg: E2EConfig;

async function loginWithPasswordAndMfa(page: Page): Promise<void> {
  await page.goto('/signin');
  await expect(page.getByRole('heading', { name: 'Anmeldung' })).toBeVisible();

  await page.locator('input[type="email"]').fill(cfg.adminEmail);
  await page.locator('input[type="password"]').fill(cfg.adminPassword);
  await page.getByRole('button', { name: 'Mit Passwort anmelden' }).click();

  await expect(page.getByText('MFA erforderlich. Bitte Code eingeben.')).toBeVisible({ timeout: 15_000 });

  const code = await generateStableTotpCode(cfg.adminTotpSecret);
  await page.locator('input[placeholder="123456"]').fill(code);
  await page.getByRole('button', { name: 'MFA bestätigen' }).click();

  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

test.describe('dashboard navigation', () => {
  let authenticator: VirtualAuthenticator | null = null;

  test.beforeAll(() => {
    cfg = getE2EConfig();
  });

  test.beforeEach(async ({ page }) => {
    authenticator = await attachVirtualAuthenticator(page);
    await loginWithPasswordAndMfa(page);
  });

  test.afterEach(async () => {
    if (authenticator) {
      await detachVirtualAuthenticator(authenticator);
      authenticator = null;
    }
  });

  test('login redirects to dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('sidebar navigation renders all links', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Übersicht' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Lizenzen' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Geräte' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Team' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Einstellungen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abmelden' })).toBeVisible();
  });

  test('devices page loads without error', async ({ page }) => {
    await page.getByRole('link', { name: 'Geräte' }).click();
    await page.waitForURL('**/devices', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Geräte' })).toBeVisible();
  });

  test('team page loads without error', async ({ page }) => {
    await page.getByRole('link', { name: 'Team' }).click();
    await page.waitForURL('**/team', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Team' })).toBeVisible();
  });

  test('settings page loads without error', async ({ page }) => {
    await page.getByRole('link', { name: 'Einstellungen' }).click();
    await page.waitForURL('**/settings', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible();
  });

  test('unauthenticated access to dashboard redirects to signin', async ({ browser }) => {
    // New context without cookies
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/signin/);
    await context.close();
  });

  test('sign out clears session and redirects to signin', async ({ page }) => {
    await page.getByRole('button', { name: 'Abmelden' }).click();
    await expect(page).toHaveURL(/\/signin/, { timeout: 10_000 });
    // After sign-out, /dashboard should redirect back to /signin
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/signin/);
  });
});
