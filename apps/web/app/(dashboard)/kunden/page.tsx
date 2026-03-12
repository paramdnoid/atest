'use client';

import { Building2 } from 'lucide-react';
import { TradeModuleSkeleton } from '@/components/dashboard/trade-module-skeleton';

export default function KundenPage() {
  return (
    <TradeModuleSkeleton
      title="Kunden & Objekte"
      description="Kundenstammdaten, Objekte und Ansprechpartner für Folgeaufträge organisieren."
      badge="Maler und Tapezierer"
      kpiLabel="Aktive Kunden"
      nextLabel="Nächster Kontakt"
      complianceLabel="Objektdaten"
      emptyTitle="Noch keine Kundenobjekte"
      emptyDescription="Kunden und zugehörige Objekte werden hier für die Auftragsabwicklung gepflegt."
      icon={Building2}
    />
  );
}
