'use client';

import { Clock3 } from 'lucide-react';
import { TradeModuleSkeleton } from '@/components/dashboard/trade-module-skeleton';

export default function ZeitenPage() {
  return (
    <TradeModuleSkeleton
      title="Zeiterfassung"
      description="Arbeitszeiten pro Team, Baustelle und Auftrag digital erfassen."
      badge="Maler und Tapezierer"
      kpiLabel="Erfasste Stunden heute"
      nextLabel="Nächste Freigabe"
      complianceLabel="Projektbezug"
      emptyTitle="Noch keine Zeiteinträge"
      emptyDescription="Zeiteinträge aus Web und mobil erscheinen hier für Prüfung und Freigabe."
      icon={Clock3}
    />
  );
}
