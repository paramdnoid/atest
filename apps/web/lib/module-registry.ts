import type { Route } from 'next';
import { Key, LayoutDashboard, Monitor, Settings, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { Capability } from '@/lib/effective-profile';

export type ModuleRegistryItem = {
  id: 'dashboard' | 'licenses' | 'devices' | 'team' | 'settings';
  href: Route<string>;
  label: string;
  icon: LucideIcon;
  requiredCapabilities: Capability[];
};

export const moduleRegistry: ModuleRegistryItem[] = [
  {
    id: 'dashboard',
    href: '/dashboard' as Route<string>,
    label: 'Übersicht',
    icon: LayoutDashboard,
    requiredCapabilities: ['dashboard:view'],
  },
  {
    id: 'licenses',
    href: '/licenses' as Route<string>,
    label: 'Abrechnung',
    icon: Key,
    requiredCapabilities: ['licenses:view'],
  },
  {
    id: 'devices',
    href: '/devices' as Route<string>,
    label: 'Geräte',
    icon: Monitor,
    requiredCapabilities: ['devices:view'],
  },
  {
    id: 'team',
    href: '/team' as Route<string>,
    label: 'Team & Lizenzen',
    icon: Users,
    requiredCapabilities: ['team:view'],
  },
  {
    id: 'settings',
    href: '/settings' as Route<string>,
    label: 'Einstellungen',
    icon: Settings,
    requiredCapabilities: ['settings:view'],
  },
];
