'use client';

import { Ruler } from 'lucide-react';
import { TradeModuleSkeleton } from '@/components/dashboard/trade-module-skeleton';

export default function AufmassPage() {
  return (
    <TradeModuleSkeleton
      title="Aufmaß"
      description="Digitale Erfassung und prüfbare Dokumentation von Flächen und Leistungen."
      badge="Maler und Tapezierer"
      kpiLabel="Offene Aufmaße"
      nextLabel="Nächste Prüfung"
      complianceLabel="VOB-Prüfbarkeit"
      emptyTitle="Noch keine Aufmaße"
      emptyDescription="Erfasste Aufmaße erscheinen hier inklusive Prüf- und Freigabestatus."
      icon={Ruler}
    />
  );
}
