import { AlertTriangle, ClipboardCheck, Clock3 } from 'lucide-react';

import { KpiStrip } from '@/components/dashboard/kpi-strip';
import type { KpiStripItem } from '@/components/dashboard/kpi-strip';
import { getKpiSummary } from '@/lib/abnahmen/selectors';
import type { AbnahmeRecord } from '@/lib/abnahmen/types';

export function getAbnahmenKpiItems(records: AbnahmeRecord[]): KpiStripItem[] {
  const kpis = getKpiSummary(records);
  return [
    {
      icon: ClipboardCheck,
      label: 'Offene Abnahmen',
      value: kpis.openAbnahmen,
      subtitle: 'Alle Vorgänge vor Abschluss',
    },
    {
      icon: AlertTriangle,
      label: 'Kritische Mängel',
      value: kpis.criticalDefects,
      subtitle: 'Sofortmaßnahmen erforderlich',
      accent: true,
    },
    {
      icon: Clock3,
      label: 'Überfällige Nacharbeit',
      value: kpis.overdueRework,
      subtitle: 'Frist bereits überschritten',
    },
  ];
}

export function AbnahmenKpiStrip({ records }: { records: AbnahmeRecord[] }) {
  return <KpiStrip items={getAbnahmenKpiItems(records)} />;
}
