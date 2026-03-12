import { resolveCapabilityProfile } from '@/lib/capability-mock';

export type Capability =
  | 'dashboard:view'
  | 'licenses:view'
  | 'devices:view'
  | 'team:view'
  | 'settings:view';

export type EffectiveRole = 'owner' | 'admin' | 'member';
export type EffectiveTrade = 'ELEKTRO' | 'SHK' | 'MALER';

export type EffectiveProfile = {
  userName?: string;
  userEmail?: string;
  tenantName: string;
  role: EffectiveRole;
  trade: EffectiveTrade;
  capabilities: Capability[];
  source: 'api' | 'mock';
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

const CAPABILITY_SET = new Set<Capability>([
  'dashboard:view',
  'licenses:view',
  'devices:view',
  'team:view',
  'settings:view',
]);

const ROLE_CAPABILITIES: Record<EffectiveRole, Capability[]> = {
  owner: ['dashboard:view', 'licenses:view', 'devices:view', 'team:view', 'settings:view'],
  admin: ['dashboard:view', 'devices:view', 'team:view', 'settings:view'],
  member: ['dashboard:view', 'devices:view'],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function pickStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function extractFromPath(source: unknown, path: string[]): unknown {
  let current: unknown = source;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

function pickFirstString(source: unknown, paths: string[][]): string | undefined {
  for (const path of paths) {
    const value = pickString(extractFromPath(source, path));
    if (value) return value;
  }
  return undefined;
}

function parseRole(source: unknown): EffectiveRole | undefined {
  const directRole = pickFirstString(source, [
    ['role'],
    ['userRole'],
    ['membership', 'role'],
    ['workspace', 'role'],
    ['tenant', 'role'],
    ['user', 'role'],
  ]);

  const roleCandidates = [
    directRole,
    pickStringArray(extractFromPath(source, ['roles']))[0],
    pickStringArray(extractFromPath(source, ['user', 'roles']))[0],
  ].filter(Boolean) as string[];

  for (const candidate of roleCandidates) {
    const normalized = candidate.toLowerCase();
    if (normalized === 'owner' || normalized === 'admin' || normalized === 'member') {
      return normalized;
    }
  }
  return undefined;
}

function parseTrade(source: unknown): EffectiveTrade | undefined {
  const candidate = pickFirstString(source, [
    ['trade'],
    ['tradeName'],
    ['workspace', 'trade'],
    ['workspace', 'tradeName'],
    ['tenant', 'trade'],
    ['tenant', 'tradeName'],
  ]);

  const normalized = candidate?.toUpperCase();
  if (normalized === 'ELEKTRO' || normalized === 'SHK' || normalized === 'MALER') {
    return normalized;
  }
  return undefined;
}

function parseTenantName(source: unknown): string | undefined {
  return pickFirstString(source, [
    ['tenantName'],
    ['workspaceName'],
    ['name'],
    ['workspace', 'name'],
    ['workspace', 'workspaceName'],
    ['tenant', 'name'],
    ['tenant', 'tenantName'],
    ['companyName'],
  ]);
}

function parseUserName(source: unknown): string | undefined {
  return pickFirstString(source, [
    ['fullName'],
    ['userName'],
    ['user', 'fullName'],
    ['user', 'name'],
  ]);
}

function parseUserEmail(source: unknown): string | undefined {
  return pickFirstString(source, [
    ['email'],
    ['userEmail'],
    ['user', 'email'],
  ]);
}

function parseCapabilities(source: unknown): Capability[] {
  const rawCandidates = [
    ...pickStringArray(extractFromPath(source, ['capabilities'])),
    ...pickStringArray(extractFromPath(source, ['permissions'])),
    ...pickStringArray(extractFromPath(source, ['scopes'])),
    ...pickStringArray(extractFromPath(source, ['claims', 'capabilities'])),
    ...pickStringArray(extractFromPath(source, ['user', 'capabilities'])),
  ];

  const normalized = rawCandidates
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry): entry is Capability => CAPABILITY_SET.has(entry as Capability));

  return Array.from(new Set(normalized));
}

export function normalizeEffectiveProfileResponse(
  payload: unknown,
): Omit<EffectiveProfile, 'source'> | null {
  const envelopeCandidates: unknown[] = [payload];
  if (isRecord(payload)) {
    envelopeCandidates.push(payload.data, payload.result, payload.payload, payload.workspace, payload.user);
  }

  for (const candidate of envelopeCandidates) {
    if (!candidate) continue;

    const role = parseRole(candidate) ?? parseRole(payload);
    const trade = parseTrade(candidate) ?? parseTrade(payload);
    const tenantName = parseTenantName(candidate) ?? parseTenantName(payload);
    const directCapabilities = [
      ...parseCapabilities(candidate),
      ...parseCapabilities(payload),
    ];
    const capabilities = directCapabilities.length > 0 ? directCapabilities : (role ? ROLE_CAPABILITIES[role] : []);

    if (role && trade && tenantName && capabilities.length > 0) {
      return {
        role,
        trade,
        tenantName,
        capabilities,
      };
    }
  }

  return null;
}

async function fetchFirstSuccessfulProfilePayload(token: string): Promise<unknown> {
  const endpoints = ['/v1/workspace/me', '/v1/auth/me'];
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`API request failed (${response.status}): ${endpoint}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown profile API error');
    }
  }

  throw lastError ?? new Error('No profile endpoint available');
}

async function fetchOptionalPayload(token: string, endpoint: string): Promise<unknown | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function loadEffectiveProfile(
  token: string,
  fallbackProfileId?: string,
): Promise<EffectiveProfile> {
  const fallback = resolveCapabilityProfile(fallbackProfileId);

  try {
    const payload = await fetchFirstSuccessfulProfilePayload(token);
    const normalized = normalizeEffectiveProfileResponse(payload);
    let userName = parseUserName(payload);
    let userEmail = parseUserEmail(payload);

    if (!userName || !userEmail) {
      const onboardingPayload = await fetchOptionalPayload(token, '/v1/onboarding/status');
      if (onboardingPayload) {
        userName = userName ?? parseUserName(onboardingPayload);
        userEmail = userEmail ?? parseUserEmail(onboardingPayload);
      }
    }

    if (normalized) {
      return {
        userName,
        userEmail,
        ...normalized,
        source: 'api',
      };
    }

    const role = parseRole(payload) ?? fallback.role;
    const trade = parseTrade(payload) ?? fallback.trade;
    const tenantName = parseTenantName(payload) ?? fallback.tenantName;
    const directCapabilities = parseCapabilities(payload);
    const capabilities =
      directCapabilities.length > 0 ? directCapabilities : ROLE_CAPABILITIES[role] ?? fallback.capabilities;

    if (tenantName !== fallback.tenantName) {
      return {
        userName,
        userEmail,
        tenantName,
        role,
        trade,
        capabilities,
        source: 'api',
      };
    }

    return {
      tenantName: fallback.tenantName,
      role: fallback.role,
      trade: fallback.trade,
      capabilities: fallback.capabilities,
      source: 'mock',
    };
  } catch {
    return {
      tenantName: fallback.tenantName,
      role: fallback.role,
      trade: fallback.trade,
      capabilities: fallback.capabilities,
      source: 'mock',
    };
  }
}
