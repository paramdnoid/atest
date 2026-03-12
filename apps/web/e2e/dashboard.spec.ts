import { expect, test, type Page } from '@playwright/test';
import { getE2EPasswordConfig, type E2EPasswordConfig } from './helpers/env';
import { flushRateLimits } from './helpers/flush-rate-limits';
import { generateStableTotpCode } from './helpers/totp';
import { attachVirtualAuthenticator, detachVirtualAuthenticator, type VirtualAuthenticator } from './helpers/webauthn';

let cfg: E2EPasswordConfig;

async function getVisibleSidebarOrSkip(page: Page) {
  const sidebars = page.locator('aside');
  test.skip((await sidebars.count()) === 0, 'Sidebar ist für dieses Profil/Layout nicht sichtbar.');
  return sidebars.first();
}

async function loginWithPasswordAndMfa(page: Page): Promise<void> {
  await page.goto('/signin');
  await expect(page.getByRole('heading', { name: 'Willkommen zurück.' })).toBeVisible();

  await page.locator('input[type="email"]').fill(cfg.adminEmail);
  await page.locator('input[type="password"]').fill(cfg.adminPassword);
  await page.getByRole('button', { name: 'Anmelden' }).click();

  // Je nach Account-Rolle und Server-Konfiguration kann MFA optional sein.
  const nextStep = await Promise.any([
    page.waitForURL('**/dashboard', { timeout: 15_000 }).then(() => 'dashboard'),
    page
      .getByLabel('Authenticator-Code')
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => 'mfa'),
  ]);

  if (nextStep === 'mfa') {
    if (!cfg.adminTotpSecret) {
      throw new Error('MFA ist aktiv, aber E2E_ADMIN_TOTP_SECRET wurde nicht gesetzt.');
    }
    const code = await generateStableTotpCode(cfg.adminTotpSecret);
    await page.locator('input[placeholder="000000"]').fill(code);
    await page.getByRole('button', { name: 'Bestätigen' }).click();
  }

  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

test.describe('dashboard navigation', () => {
  let authenticator: VirtualAuthenticator | null = null;

  test.beforeAll(() => {
    cfg = getE2EPasswordConfig();
  });

  test.beforeEach(async ({ page }) => {
    flushRateLimits();
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

  test('sidebar navigation renders available links', async ({ page }) => {
    const sidebar = await getVisibleSidebarOrSkip(page);

    const visibleNavCount = await sidebar.getByRole('link').count();
    expect(visibleNavCount).toBeGreaterThan(0);
  });

  test('devices page loads without error', async ({ page }) => {
    const sidebar = await getVisibleSidebarOrSkip(page);
    const devicesLink = sidebar.getByRole('link', { name: 'Geräte', exact: true });
    test.skip((await devicesLink.count()) === 0, 'Geräte-Link ist für dieses Profil nicht sichtbar.');
    await devicesLink.click();
    await page.waitForURL('**/devices', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Geräte' })).toBeVisible();
  });

  test('team page loads without error', async ({ page }) => {
    const sidebar = await getVisibleSidebarOrSkip(page);
    const teamLink = sidebar.getByRole('link', { name: 'Team & Lizenzen', exact: true });
    test.skip((await teamLink.count()) === 0, 'Team-Link ist für dieses Profil nicht sichtbar.');
    await teamLink.click();
    await page.waitForURL('**/team', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Team & Lizenzen' })).toBeVisible();
  });

  test('settings page loads without error', async ({ page }) => {
    const sidebar = await getVisibleSidebarOrSkip(page);
    const settingsLink = sidebar.getByRole('link', { name: 'Einstellungen', exact: true });
    test.skip((await settingsLink.count()) === 0, 'Einstellungen-Link ist für dieses Profil nicht sichtbar.');
    await settingsLink.click();
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
    const sidebar = await getVisibleSidebarOrSkip(page);
    const userMenuButton = sidebar.locator('button[aria-haspopup="menu"]').first();
    test.skip((await userMenuButton.count()) === 0, 'Benutzermenü in Sidebar nicht verfügbar.');
    await userMenuButton.click();
    await page.getByRole('menuitem', { name: 'Abmelden' }).click();
    await expect(page).toHaveURL(/\/signin/, { timeout: 10_000 });
    // After sign-out, /dashboard should redirect back to /signin
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/signin/);
  });
});
