import { expect, type Page } from '@playwright/test';

import type { E2EPasswordConfig } from './env';
import { generateStableTotpCode } from './totp';

type OpenModuleOptions = {
  linkName: string;
  route: string;
  headingName: string;
};

type LoginOptions = {
  mockProfileId?: string;
};

export async function loginWithPasswordAndMfa(
  page: Page,
  cfg: E2EPasswordConfig,
  options?: LoginOptions,
): Promise<void> {
  if (options?.mockProfileId) {
    await page.addInitScript((profileId) => {
      window.localStorage.setItem('zg_mock_profile_id', profileId);
    }, options.mockProfileId);
  }

  await page.goto('/signin');
  await expect(page.getByRole('heading', { name: 'Willkommen zurück.' })).toBeVisible();

  await page.locator('input[type="email"]').fill(cfg.adminEmail);
  await page.locator('input[type="password"]').fill(cfg.adminPassword);
  await page.getByRole('button', { name: 'Anmelden' }).click();

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

export async function openModuleRoute(page: Page, options: OpenModuleOptions): Promise<void> {
  const link = page.getByRole('link', { name: options.linkName });
  if ((await link.count()) > 0) {
    await link.click();
  } else {
    await page.goto(options.route);
  }

  await page.waitForURL(`**${options.route}`, { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: options.headingName })).toBeVisible();
}

export async function openModuleRouteIfAvailable(page: Page, options: OpenModuleOptions): Promise<boolean> {
  const link = page.getByRole('link', { name: options.linkName });
  if ((await link.count()) > 0) {
    await link.click();
  } else {
    await page.goto(options.route);
  }

  try {
    await page.waitForURL(`**${options.route}`, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: options.headingName })).toBeVisible();
    return true;
  } catch {
    return false;
  }
}
