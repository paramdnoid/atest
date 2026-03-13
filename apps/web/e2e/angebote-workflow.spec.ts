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

test.describe('angebote workflow', () => {
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

  test('opens angebote list and executes core workspace flow when module is visible', async ({ page }) => {
    const isAvailable = await openModuleRouteIfAvailable(page, {
      linkName: 'Angebote & Aufträge',
      route: '/angebote',
      headingName: 'Angebote & Auftraege',
    });
    test.skip(!isAvailable, 'Angebote-Modul ist fuer dieses Profil/Backend nicht erreichbar.');

    const firstQuoteLink = page.locator('a[href^="/angebote/"]').first();
    test.skip((await firstQuoteLink.count()) === 0, 'Keine Angebotsdatensaetze vorhanden.');
    await firstQuoteLink.click();
    await page.waitForURL('**/angebote/*', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Angebots-Workspace' })).toBeVisible();

    await page.getByRole('button', { name: 'Optionen' }).click();
    await expect(page.getByText('Good - Funktional')).toBeVisible();

    await page.getByRole('button', { name: 'Freigabe' }).click();
    await expect(page.getByRole('button', { name: 'Freigeben' })).toBeVisible();

    await page.getByRole('button', { name: 'Quick Convert' }).click();
    await expect(page.getByText('Aktion blockiert:')).toBeVisible();
    await expect(page.getByText('Konvertierung ist nur aus Status SENT erlaubt.')).toBeVisible();

    await page.getByRole('button', { name: 'Historie' }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await expect(page.getByText('Angebot aus Aufmass vorgeschlagen')).toBeVisible();
  });
});
