import type { KundenRolle } from '@/lib/kunden/types';

const allowedRoles: KundenRolle[] = ['owner', 'admin', 'dispo', 'tech'];

export function resolveViewerRole(value: string | undefined): KundenRolle {
  if (!value) return 'tech';
  return allowedRoles.includes(value as KundenRolle) ? (value as KundenRolle) : 'tech';
}
