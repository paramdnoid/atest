import { expect, test } from '@playwright/test';

import { getE2EPasswordConfig, type E2EPasswordConfig } from './helpers/env';
import { flushRateLimits } from './helpers/flush-rate-limits';
import {
  attachVirtualAuthenticator,
  detachVirtualAuthenticator,
  type VirtualAuthenticator,
} from './helpers/webauthn';
import { loginWithPasswordAndMfa, openModuleRoute } from './helpers/workflow';

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
    await openModuleRoute(page, {
      linkName: 'Abnahmen & Mängel',
      route: '/abnahmen',
      headingName: 'Abnahmen & Mängel',
    });
    await expect(page.getByText('Offene Abnahmen')).toBeVisible();

    await page.getByRole('link', { name: 'ABN-26-001' }).click();
    await page.waitForURL('**/abnahmen/abn-26-001', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Abnahmeakte' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mangel erfassen' })).toBeVisible();

    await page.getByRole('tab', { name: 'Mängel' }).click();
    await expect(page.getByRole('tabpanel', { name: 'Mängel' })).toBeVisible();
    await expect(page.getByText('Mangelkontext')).toBeVisible();

    await page.getByRole('tab', { name: 'Historie' }).click();
    await expect(page.getByRole('tabpanel', { name: 'Historie' })).toBeVisible();
    await expect(page.getByText('Kurzüberblick')).toBeVisible();
  });
});
