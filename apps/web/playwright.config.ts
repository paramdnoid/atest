import { defineConfig, devices } from '@playwright/test';
import { loadE2EEnvFiles } from './e2e/helpers/load-env';

loadE2EEnvFiles();

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3001';
const apiBaseURL = process.env.E2E_API_BASE_URL ?? 'http://localhost:8080';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'pnpm --filter @zunftgewerk/web dev -p 3001',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_BASE_URL: apiBaseURL
    }
  }
});
