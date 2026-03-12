'use client';

import { ClipboardCheck } from 'lucide-react';
import { TradeModuleSkeleton } from '@/components/dashboard/trade-module-skeleton';

export default function AbnahmenPage() {
  return (
    <TradeModuleSkeleton
      title="Abnahmen & Mängel"
      description="Abnahmen dokumentieren, Mängel erfassen und Nacharbeit transparent verfolgen."
      badge="Maler und Tapezierer"
      kpiLabel="Offene Abnahmen"
      nextLabel="Nächster Abnahmetermin"
      complianceLabel="Mangelstatus"
      emptyTitle="Noch keine Abnahmen"
      emptyDescription="Abnahmeprotokolle, Mängel und Fotobelege werden hier zentral verwaltet."
      icon={ClipboardCheck}
    />
  );
}
