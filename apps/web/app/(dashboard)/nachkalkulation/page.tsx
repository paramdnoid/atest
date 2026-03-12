'use client';

import { Calculator } from 'lucide-react';
import { TradeModuleSkeleton } from '@/components/dashboard/trade-module-skeleton';

export default function NachkalkulationPage() {
  return (
    <TradeModuleSkeleton
      title="Nachkalkulation"
      description="Soll-Ist-Vergleiche von Zeit, Material und Marge pro Auftrag auswerten."
      badge="Maler und Tapezierer"
      kpiLabel="Abgeschlossene Aufträge"
      nextLabel="Nächste Auswertung"
      complianceLabel="Deckungsbeitrag"
      emptyTitle="Noch keine Auswertungen"
      emptyDescription="Sobald Aufträge abgeschlossen sind, erscheinen hier Nachkalkulationen mit Kennzahlen."
      icon={Calculator}
    />
  );
}
