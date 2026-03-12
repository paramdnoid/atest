import type { Route } from 'next';
import {
  BriefcaseBusiness,
  Building2,
  Calculator,
  ClipboardCheck,
  Clock3,
  FileText,
  Key,
  LayoutDashboard,
  Monitor,
  Package,
  ReceiptText,
  Ruler,
  Settings,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { Capability, EffectiveTrade } from '@/lib/effective-profile';

export type ModuleGroup =
  | 'hauptmenue'
  | 'auftragsabwicklung'
  | 'betrieb'
  | 'finanzen'
  | 'verwaltung';

export type ModuleRegistryItem = {
  id:
    | 'dashboard'
    | 'aufmass'
    | 'angebote'
    | 'baustellen'
    | 'zeiten'
    | 'material'
    | 'rechnungen'
    | 'abnahmen'
    | 'nachkalkulation'
    | 'kunden'
    | 'licenses'
    | 'devices'
    | 'team'
    | 'settings';
  href: Route<string>;
  label: string;
  icon: LucideIcon;
  group: ModuleGroup;
  trades?: EffectiveTrade[];
  requiredCapabilities: Capability[];
};

export const moduleRegistry: ModuleRegistryItem[] = [
  {
    id: 'dashboard',
    href: '/dashboard' as Route<string>,
    label: 'Übersicht',
    icon: LayoutDashboard,
    group: 'hauptmenue',
    requiredCapabilities: ['dashboard:view'],
  },
  {
    id: 'aufmass',
    href: '/aufmass' as Route<string>,
    label: 'Aufmaß',
    icon: Ruler,
    group: 'auftragsabwicklung',
    trades: ['MALER'],
    requiredCapabilities: ['aufmass:view'],
  },
  {
    id: 'angebote',
    href: '/angebote' as Route<string>,
    label: 'Angebote & Aufträge',
    icon: FileText,
    group: 'auftragsabwicklung',
    trades: ['MALER'],
    requiredCapabilities: ['quotes:view'],
  },
  {
    id: 'baustellen',
    href: '/baustellen' as Route<string>,
    label: 'Baustellen',
    icon: BriefcaseBusiness,
    group: 'betrieb',
    trades: ['MALER'],
    requiredCapabilities: ['sites:view'],
  },
  {
    id: 'zeiten',
    href: '/zeiten' as Route<string>,
    label: 'Zeiterfassung',
    icon: Clock3,
    group: 'betrieb',
    trades: ['MALER'],
    requiredCapabilities: ['time:view'],
  },
  {
    id: 'material',
    href: '/material' as Route<string>,
    label: 'Material',
    icon: Package,
    group: 'betrieb',
    trades: ['MALER'],
    requiredCapabilities: ['materials:view'],
  },
  {
    id: 'rechnungen',
    href: '/rechnungen' as Route<string>,
    label: 'Rechnungen',
    icon: ReceiptText,
    group: 'finanzen',
    trades: ['MALER'],
    requiredCapabilities: ['invoices:view'],
  },
  {
    id: 'abnahmen',
    href: '/abnahmen' as Route<string>,
    label: 'Abnahmen & Mängel',
    icon: ClipboardCheck,
    group: 'auftragsabwicklung',
    trades: ['MALER'],
    requiredCapabilities: ['handover:view'],
  },
  {
    id: 'nachkalkulation',
    href: '/nachkalkulation' as Route<string>,
    label: 'Nachkalkulation',
    icon: Calculator,
    group: 'finanzen',
    trades: ['MALER'],
    requiredCapabilities: ['controlling:view'],
  },
  {
    id: 'kunden',
    href: '/kunden' as Route<string>,
    label: 'Kunden & Objekte',
    icon: Building2,
    group: 'auftragsabwicklung',
    trades: ['MALER'],
    requiredCapabilities: ['customers:view'],
  },
  {
    id: 'licenses',
    href: '/licenses' as Route<string>,
    label: 'Abrechnung',
    icon: Key,
    group: 'verwaltung',
    requiredCapabilities: ['licenses:view'],
  },
  {
    id: 'devices',
    href: '/devices' as Route<string>,
    label: 'Geräte',
    icon: Monitor,
    group: 'verwaltung',
    requiredCapabilities: ['devices:view'],
  },
  {
    id: 'team',
    href: '/team' as Route<string>,
    label: 'Team & Lizenzen',
    icon: Users,
    group: 'verwaltung',
    requiredCapabilities: ['team:view'],
  },
  {
    id: 'settings',
    href: '/settings' as Route<string>,
    label: 'Einstellungen',
    icon: Settings,
    group: 'verwaltung',
    requiredCapabilities: ['settings:view'],
  },
];
