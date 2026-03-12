import { Building2 } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import type { KundenObjekt } from '@/lib/kunden/types';

export function ObjektPortfolioCard({ objekte }: { objekte: KundenObjekt[] }) {
  return (
    <ModuleTableCard
      icon={Building2}
      label="Objekte"
      title="Objektportfolio"
      hasData={objekte.length > 0}
      emptyState={{
        icon: <Building2 className="h-8 w-8" />,
        title: 'Keine Objekte vorhanden',
        description: 'Lege ein erstes Objekt an, um Folgeauftraege zu strukturieren.',
      }}
    >
      <div className="space-y-2">
        {objekte.map((objekt) => (
          <div key={objekt.id} className="rounded-lg border border-border bg-sidebar/20 p-3 text-sm">
            <p className="font-medium">{objekt.name}</p>
            <p className="text-muted-foreground">{objekt.adresse}</p>
            <p className="text-xs text-muted-foreground">
              {objekt.objektTyp} · Risiko {objekt.riskClass} · Intervall {objekt.serviceIntervalDays} Tage
            </p>
          </div>
        ))}
      </div>
    </ModuleTableCard>
  );
}
