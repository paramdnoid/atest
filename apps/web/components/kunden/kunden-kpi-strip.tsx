import { AlertTriangle, Building2, CalendarClock, Users } from 'lucide-react';
import type { ComponentType } from 'react';

import { StatCard } from '@/components/dashboard/stat-card';
import type { KundenKpis } from '@/lib/kunden/types';

export function KundenKpiStrip({ kpis }: { kpis: KundenKpis }) {
  const items: Array<{
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    subtitle: string;
    accent?: boolean;
  }> = [
    {
      icon: Users,
      label: 'Aktive Kunden',
      value: kpis.aktiveKunden,
      subtitle: 'Status AKTIV',
    },
    {
      icon: Building2,
      label: 'Objekte mit SLA-Risiko',
      value: kpis.objekteMitSlaRisiko,
      subtitle: 'Reminder mit Risiko',
      accent: true,
    },
    {
      icon: CalendarClock,
      label: 'Offene Follow-ups',
      value: kpis.offeneFollowUps,
      subtitle: 'Mit naechstem Kontakttermin',
    },
    {
      icon: AlertTriangle,
      label: 'Duplikatverdacht',
      value: kpis.duplikatVerdacht,
      subtitle: 'Offene Duplicate Candidates',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatCard
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
          subtitle={item.subtitle}
          accent={item.accent}
        />
      ))}
    </div>
  );
}
