import { ArrowRight, CreditCard, Settings, Users, Zap } from 'lucide-react';
import Link from 'next/link';

import {
  DashboardCard,
  DashboardCardHeader,
} from '@/components/dashboard/dashboard-card';
import { cn } from '@/lib/utils';

type QuickAction = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
};

const actions: QuickAction[] = [
  {
    href: '/team',
    title: 'Team & Lizenzen',
    description: 'Benutzerlizenzen verwalten',
    icon: Users,
    accent: true,
  },
  {
    href: '/licenses',
    title: 'Abrechnung',
    description: 'Plan & Rechnungen',
    icon: CreditCard,
  },
  {
    href: '/settings',
    title: 'Einstellungen',
    description: 'Workspace konfigurieren',
    icon: Settings,
  },
];

export function QuickActions() {
  return (
    <DashboardCard>
      <DashboardCardHeader icon={Zap} label="Navigation" title="Schnellzugriff" />

      <div className="grid grid-cols-2 gap-1.5 p-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                'group relative flex flex-col gap-2 overflow-hidden rounded-lg border p-3 transition-all duration-200',
                'hover:-translate-y-px',
                action.accent
                  ? ['border-border bg-background/90', 'hover:border-border/90 hover:bg-background']
                  : ['border-border bg-sidebar/35', 'hover:border-border/90 hover:bg-sidebar/50'],
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105',
                  action.accent
                    ? 'bg-muted text-primary'
                    : 'bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className={cn('text-sm font-semibold leading-none', action.accent && 'text-foreground')}>
                  {action.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
              </div>
              <ArrowRight
                className={cn(
                  'absolute top-3 right-3 h-3.5 w-3.5 transition-all duration-200 group-hover:translate-x-0.5',
                  action.accent
                    ? 'text-muted-foreground/40 group-hover:text-muted-foreground/70'
                    : 'text-muted-foreground/30 group-hover:text-muted-foreground/60',
                )}
              />
            </Link>
          );
        })}
      </div>
    </DashboardCard>
  );
}
