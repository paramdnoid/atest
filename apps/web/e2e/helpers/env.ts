const REQUIRED_VARS = ['E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD', 'E2E_ADMIN_TOTP_SECRET'] as const;

export type E2EConfig = {
  adminEmail: string;
  adminPassword: string;
  adminTotpSecret: string;
  baseURL: string;
  apiBaseURL: string;
};

export function getE2EConfig(): E2EConfig {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required E2E env vars: ${missing.join(', ')}. ` +
      'Provide these variables before running Playwright E2E tests.'
    );
  }

  return {
    adminEmail: process.env.E2E_ADMIN_EMAIL!.trim().toLowerCase(),
    adminPassword: process.env.E2E_ADMIN_PASSWORD!.trim(),
    adminTotpSecret: process.env.E2E_ADMIN_TOTP_SECRET!.trim(),
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3001',
    apiBaseURL: process.env.E2E_API_BASE_URL ?? 'http://localhost:8080'
  };
}
