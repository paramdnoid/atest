'use client';

import { ReceiptText } from 'lucide-react';
import { TradeModuleSkeleton } from '@/components/dashboard/trade-module-skeleton';

export default function RechnungenPage() {
  return (
    <TradeModuleSkeleton
      title="Rechnungen"
      description="Teil-, Schluss- und E-Rechnungen für B2B-Aufträge erstellen und verfolgen."
      badge="Maler und Tapezierer"
      kpiLabel="Offene Rechnungen"
      nextLabel="Nächste Fälligkeit"
      complianceLabel="E-Rechnung"
      emptyTitle="Noch keine Rechnungen"
      emptyDescription="Rechnungen inklusive Status und Versandkanal werden hier angezeigt."
      icon={ReceiptText}
    />
  );
}
