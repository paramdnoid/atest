'use client';

import { Package } from 'lucide-react';
import { TradeModuleSkeleton } from '@/components/dashboard/trade-module-skeleton';

export default function MaterialPage() {
  return (
    <TradeModuleSkeleton
      title="Material"
      description="Materialpositionen, Verbrauch und Einkauf für laufende Aufträge steuern."
      badge="Maler und Tapezierer"
      kpiLabel="Offene Materialbedarfe"
      nextLabel="Nächste Bestellung"
      complianceLabel="Preisdaten"
      emptyTitle="Noch kein Material erfasst"
      emptyDescription="Materiallisten und Verbrauchsmeldungen werden hier pro Auftrag aggregiert."
      icon={Package}
    />
  );
}
