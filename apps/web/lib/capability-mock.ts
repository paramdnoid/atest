export const CAPABILITY_PROFILE_STORAGE_KEY = 'zg_mock_profile_id';

import type { Capability, EffectiveRole, EffectiveTrade } from '@/lib/effective-profile';

export type CapabilityProfile = {
  id: string;
  label: string;
  tenantName: string;
  role: EffectiveRole;
  trade: EffectiveTrade;
  capabilities: Capability[];
};

export const capabilityProfiles: CapabilityProfile[] = [
  {
    id: 'owner-elektro',
    label: 'Owner · Elektro',
    tenantName: 'Elektro Bergmann GmbH',
    role: 'owner',
    trade: 'ELEKTRO',
    capabilities: ['dashboard:view', 'licenses:view', 'devices:view', 'team:view', 'settings:view'],
  },
  {
    id: 'admin-shk',
    label: 'Admin · SHK',
    tenantName: 'SHK Nord Service',
    role: 'admin',
    trade: 'SHK',
    capabilities: ['dashboard:view', 'devices:view', 'team:view', 'settings:view'],
  },
  {
    id: 'member-maler',
    label: 'Member · Maler',
    tenantName: 'Malerbetrieb Isar',
    role: 'member',
    trade: 'MALER',
    capabilities: [
      'dashboard:view',
      'devices:view',
      'aufmass:view',
      'quotes:view',
      'sites:view',
      'time:view',
      'materials:view',
      'handover:view',
      'customers:view',
    ],
  },
];

export const defaultCapabilityProfile = capabilityProfiles[0];

export function resolveCapabilityProfile(profileId?: string): CapabilityProfile {
  if (!profileId) return defaultCapabilityProfile;
  return capabilityProfiles.find((profile) => profile.id === profileId) ?? defaultCapabilityProfile;
}
