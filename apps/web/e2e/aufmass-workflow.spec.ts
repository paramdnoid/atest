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

test.describe('aufmass workflow', () => {
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

  test('opens aufmass list and detail workspace when module is available', async ({ page }) => {
    await openModuleRoute(page, {
      linkName: 'Aufmaß',
      route: '/aufmass',
      headingName: 'Aufmaß',
    });

    await page.getByRole('link', { name: 'AM-26-001' }).click();
    await page.waitForURL('**/aufmass/am-26-001', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Aufmaß-Arbeitsbereich' })).toBeVisible();

    await page.getByRole('tab', { name: /Prüfung/ }).click();
    await expect(page.getByRole('tabpanel', { name: /Prüfung/ })).toBeVisible();
    await expect(page.getByText('Freigaberegeln')).toBeVisible();

    await page.getByRole('tab', { name: /Abrechnung/ }).click();
    await expect(page.getByRole('tabpanel', { name: /Abrechnung/ })).toBeVisible();
    await expect(page.getByText('Brutto').first()).toBeVisible();
    await expect(page.getByText('Abzug').first()).toBeVisible();
  });

  test('shows actionable error if status action is blocked', async ({ page }) => {
    await openModuleRoute(page, {
      linkName: 'Aufmaß',
      route: '/aufmass',
      headingName: 'Aufmaß',
    });

    await page.getByRole('link', { name: 'AM-26-001' }).click();
    await page.waitForURL('**/aufmass/am-26-001', { timeout: 10_000 });

    await page.getByRole('tab', { name: /Abrechnung/ }).click();
    await expect(page.getByRole('button', { name: 'Als abgerechnet markieren' })).toBeDisabled();
  });

  test('supports keyboard navigation across tabs', async ({ page }) => {
    await openModuleRoute(page, {
      linkName: 'Aufmaß',
      route: '/aufmass',
      headingName: 'Aufmaß',
    });

    await page.getByRole('link', { name: 'AM-26-001' }).click();
    await page.waitForURL('**/aufmass/am-26-001', { timeout: 10_000 });

    const captureTab = page.getByRole('tab', { name: /Erfassung/ });
    await captureTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#aufmass-workspace-panel-review')).toBeVisible();
  });
});
