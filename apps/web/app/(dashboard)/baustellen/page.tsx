'use client';

import { BriefcaseBusiness } from 'lucide-react';
import { TradeModuleSkeleton } from '@/components/dashboard/trade-module-skeleton';

export default function BaustellenPage() {
  return (
    <TradeModuleSkeleton
      title="Baustellen"
      description="Baustellenstatus, Einsatzplanung und Fotodokumentation zentral im Blick behalten."
      badge="Maler und Tapezierer"
      kpiLabel="Aktive Baustellen"
      nextLabel="Nächster Einsatz"
      complianceLabel="Dokumentation"
      emptyTitle="Noch keine Baustellen"
      emptyDescription="Angelegte Baustellen werden hier mit Fortschritt und Verantwortlichen angezeigt."
      icon={BriefcaseBusiness}
    />
  );
}
