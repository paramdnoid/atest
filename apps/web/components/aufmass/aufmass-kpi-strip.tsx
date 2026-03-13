import { AlertCircle, Building2, Calculator, ClipboardList, Ruler } from 'lucide-react';

import { KpiStrip, type KpiStripItem } from '@/components/dashboard/kpi-strip';
import { getMeasurementTotalsByUnit, getOpenBlockersCount } from '@/lib/aufmass/selectors';
import type { AufmassRecord } from '@/lib/aufmass/types';

export function AufmassKpiStrip({ record }: { record: AufmassRecord }) {
  const totals = getMeasurementTotalsByUnit(record);
  const blockers = getOpenBlockersCount(record);
  const items: KpiStripItem[] = [
    {
      icon: blockers > 0 ? AlertCircle : Calculator,
      label: 'Prüfblocker',
      value: blockers,
      subtitle: blockers > 0 ? 'Freigabe aktuell blockiert' : 'Freigabe möglich',
      tone: blockers > 0 ? 'rose' : 'emerald',
      accent: blockers > 0,
    },
    {
      icon: Ruler,
      label: 'Summen m²',
      value: totals.m2.toFixed(2),
      subtitle: `${totals.m.toFixed(2)} m · ${totals.stk.toFixed(0)} Stk`,
      tone: 'primary',
    },
    {
      icon: Building2,
      label: 'Räume',
      value: record.rooms.length,
      subtitle: `${record.positions.length} Positionen`,
      tone: 'neutral',
    },
    {
      icon: ClipboardList,
      label: 'Messwerte',
      value: record.measurements.length,
      subtitle: 'Einträge im aktuellen Aufmaß',
      tone: 'blue',
    },
  ];

  return (
    <KpiStrip items={items} />
  );
}
