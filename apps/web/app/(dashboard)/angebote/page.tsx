'use client';

import { FileText } from 'lucide-react';
import { TradeModuleSkeleton } from '@/components/dashboard/trade-module-skeleton';

export default function AngebotePage() {
  return (
    <TradeModuleSkeleton
      title="Angebote & Aufträge"
      description="Angebote, Aufträge und Positionen für Maler- und Tapezierarbeiten verwalten."
      badge="Maler und Tapezierer"
      kpiLabel="Offene Angebote"
      nextLabel="Nächster Termin"
      complianceLabel="Leistungstexte"
      emptyTitle="Noch keine Angebote"
      emptyDescription="Neue Angebote und übernommene Aufträge werden hier übersichtlich angezeigt."
      icon={FileText}
    />
  );
}
