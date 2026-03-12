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

test.describe('kunden workflow', () => {
  let authenticator: VirtualAuthenticator | null = null;

  test.beforeAll(() => {
    cfg = getE2EPasswordConfig();
  });

  test.beforeEach(async ({ page }) => {
    flushRateLimits();
    authenticator = await attachVirtualAuthenticator(page);
    await loginWithPasswordAndMfa(page, cfg, { mockProfileId: 'member-maler' });
  });

  test.afterEach(async () => {
    if (authenticator) {
      await detachVirtualAuthenticator(authenticator);
      authenticator = null;
    }
  });

  test('opens kunden list and executes elite workspace flow when module is visible', async ({ page }) => {
    const isAvailable = await openModuleRouteIfAvailable(page, {
      linkName: 'Kunden & Objekte',
      route: '/kunden',
      headingName: 'Kunden & Objekte',
    });
    test.skip(!isAvailable, 'Kunden-Modul ist fuer dieses Profil/Backend nicht erreichbar.');

    await page.getByRole('link', { name: 'KND-2026-1001' }).click();
    await page.waitForURL('**/kunden/k-1001', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Kunden-Workspace' })).toBeVisible();

    await page.getByRole('tab', { name: 'Objekte' }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await expect(page.getByText('Objektportfolio')).toBeVisible();

    await page.getByRole('tab', { name: 'Compliance' }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await expect(page.getByText('DSGVO und Retention')).toBeVisible();

    const duplicateTab = page.getByRole('tab', { name: 'Duplikate' });
    if ((await duplicateTab.count()) > 0) {
      await duplicateTab.click();
      await expect(page.getByRole('tabpanel')).toBeVisible();
      await expect(page.getByText('Duplicate Review')).toBeVisible();
    }
  });
});
