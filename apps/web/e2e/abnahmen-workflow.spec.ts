import { expect, test } from '@playwright/test';

import { getE2EPasswordConfig, type E2EPasswordConfig } from './helpers/env';
import { flushRateLimits } from './helpers/flush-rate-limits';
import {
  attachVirtualAuthenticator,
  detachVirtualAuthenticator,
  type VirtualAuthenticator,
} from './helpers/webauthn';
import { loginWithPasswordAndMfa, openModuleRouteIfAvailable } from './helpers/workflow';

let cfg: E2EPasswordConfig;

test.describe('abnahmen workflow', () => {
  let authenticator: VirtualAuthenticator | null = null;

  test.beforeAll(() => {
    cfg = getE2EPasswordConfig();
  });

  test.beforeEach(async ({ page }) => {
    flushRateLimits();
    authenticator = await attachVirtualAuthenticator(page);
    await loginWithPasswordAndMfa(page, cfg);
  });

  test.afterEach(async () => {
    if (authenticator) {
      await detachVirtualAuthenticator(authenticator);
      authenticator = null;
    }
  });

  test('opens abnahmen list and detail workspace when module is available', async ({ page }) => {
    const isAvailable = await openModuleRouteIfAvailable(page, {
      linkName: 'Abnahmen & Mängel',
      route: '/abnahmen',
      headingName: 'Abnahmen & Mängel',
    });
    test.skip(!isAvailable, 'Abnahmen-Modul ist fuer dieses Profil/Backend nicht erreichbar.');
    await expect(page.getByText('Offene Abnahmen')).toBeVisible();

    const firstAbnahmeLink = page.locator('a[href^="/abnahmen/"]').first();
    test.skip((await firstAbnahmeLink.count()) === 0, 'Keine Abnahme-Datensaetze vorhanden.');
    await firstAbnahmeLink.click();
    await page.waitForURL('**/abnahmen/*', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Abnahmeakte' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mangel erfassen' })).toBeVisible();

    await page.getByTestId('abnahmen-tab-defects').click();
    await expect(page.getByRole('tabpanel', { name: 'Mängel' })).toBeVisible();
    await expect(page.getByText('Mangelkontext')).toBeVisible();

    await page.getByTestId('abnahmen-tab-history').click();
    await expect(page.getByRole('tabpanel', { name: 'Historie' })).toBeVisible();
    await expect(page.getByText('Kurzüberblick')).toBeVisible();
  });
});
