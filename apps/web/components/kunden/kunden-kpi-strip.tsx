import { AlertTriangle, Building2, CalendarClock, Users } from 'lucide-react';

import { KpiStrip, type KpiStripItem } from '@/components/dashboard/kpi-strip';
import type { KundenKpis } from '@/lib/kunden/types';

export function getKundenKpiItems(kpis: KundenKpis): KpiStripItem[] {
  return [
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
}

export function KundenKpiStrip({ kpis }: { kpis: KundenKpis }) {
  return <KpiStrip items={getKundenKpiItems(kpis)} />;
}
