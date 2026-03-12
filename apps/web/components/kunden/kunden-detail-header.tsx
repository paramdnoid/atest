import { AlertTriangle, CheckCircle2, Workflow } from 'lucide-react';

import { DashboardCard, DashboardCardHeader } from '@/components/dashboard/dashboard-card';
import { KundenStatusBadge } from '@/components/kunden/kunden-status-badge';
import { Button } from '@/components/ui/button';
import type { KundenRecord, KundenStatus } from '@/lib/kunden/types';

const statusHelper: Record<KundenStatus, string> = {
  LEAD: 'Lead qualifizieren und erste Objektdaten erfassen.',
  AKTIV: 'Kundenbeziehung ausbauen und Folgeauftraege steuern.',
  RUHEND: 'Wiedervorlage und Reaktivierung planen.',
  ARCHIVIERT: 'Datensatz nur noch revisionssicher vorhalten.',
};

type KundenDetailHeaderProps = {
  record: KundenRecord;
  blockers: string[];
  onSetStatus: (to: KundenStatus) => void;
};

export function KundenDetailHeader({ record, blockers, onSetStatus }: KundenDetailHeaderProps) {
  return (
    <DashboardCard>
      <DashboardCardHeader icon={Workflow} label="Kundenakte" title={`${record.number} · ${record.name}`} />
      <div className="flex flex-col gap-4 p-4 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <KundenStatusBadge status={record.status} />
          <span className="text-sm text-muted-foreground">{statusHelper[record.status]}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onSetStatus('AKTIV')}>
            Aktiv setzen
          </Button>
          <Button size="sm" variant="outline" onClick={() => onSetStatus('RUHEND')}>
            Ruhend setzen
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onSetStatus('ARCHIVIERT')}>
            Archivieren
          </Button>
        </div>

        {blockers.length > 0 ? (
          <div className="rounded-lg border border-amber-300/50 bg-amber-50/70 p-3 text-sm dark:bg-amber-950/30">
            <p className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              Offene Voraussetzungen
            </p>
            <ul className="mt-2 space-y-1 text-amber-800/90 dark:text-amber-200/90">
              {blockers.map((blocker) => (
                <li key={blocker}>- {blocker}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Keine Blocker vorhanden.
          </p>
        )}
      </div>
    </DashboardCard>
  );
}
