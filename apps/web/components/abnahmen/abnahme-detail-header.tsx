import { AlertTriangle, CheckCircle2, ClipboardCheck } from 'lucide-react';

import { AbnahmenStatusBadge } from '@/components/abnahmen/abnahmen-status-badge';
import { DashboardCard, DashboardCardHeader } from '@/components/dashboard/dashboard-card';
import { Button } from '@/components/ui/button';
import type { AbnahmeRecord, AbnahmeStatus } from '@/lib/abnahmen/types';
import { getStatusLabel } from '@/lib/abnahmen/selectors';

type AbnahmeDetailHeaderProps = {
  record: AbnahmeRecord;
  blockers: string[];
  canRunInspection: boolean;
  canStartRework: boolean;
  canMarkReadyForReview: boolean;
  canAcceptWithReservation: boolean;
  canAccept: boolean;
  canClose: boolean;
  onRunInspection: () => void;
  onStartRework: () => void;
  onMarkReadyForReview: () => void;
  onAcceptWithReservation: () => void;
  onAccept: () => void;
  onClose: () => void;
};

const helperTextByStatus: Record<AbnahmeStatus, string> = {
  PREPARATION: 'Termin und Teilnehmer vollständig erfassen.',
  INSPECTION_SCHEDULED: 'Vor-Ort-Begehung dokumentieren und Protokoll ergänzen.',
  INSPECTION_DONE: 'Mängel bewerten oder direkt abnehmen.',
  DEFECTS_OPEN: 'Kritische Mängel priorisiert in Nacharbeit geben.',
  REWORK_IN_PROGRESS: 'Fortschritt der Nacharbeit transparent verfolgen.',
  REWORK_READY_FOR_REVIEW: 'Nacharbeit final prüfen und Abnahme durchführen.',
  ACCEPTED_WITH_RESERVATION: 'Vorbehalte dokumentiert nachverfolgen.',
  ACCEPTED: 'Signaturstatus prüfen und Vorgang abschließen.',
  CLOSED: 'Vorgang revisionssicher abgeschlossen.',
};

export function AbnahmeDetailHeader({
  record,
  blockers,
  canRunInspection,
  canStartRework,
  canMarkReadyForReview,
  canAcceptWithReservation,
  canAccept,
  canClose,
  onRunInspection,
  onStartRework,
  onMarkReadyForReview,
  onAcceptWithReservation,
  onAccept,
  onClose,
}: AbnahmeDetailHeaderProps) {
  return (
    <DashboardCard>
      <DashboardCardHeader icon={ClipboardCheck} label="Abnahmeakte" title={`${record.number} · ${record.projectName}`} />
      <div className="flex flex-col gap-4 p-4 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <AbnahmenStatusBadge status={record.status} />
          <span className="text-sm text-muted-foreground">{helperTextByStatus[record.status]}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onRunInspection} disabled={!canRunInspection}>
            Begehung abschließen
          </Button>
          <Button size="sm" variant="outline" onClick={onStartRework} disabled={!canStartRework}>
            Nacharbeit starten
          </Button>
          <Button size="sm" variant="outline" onClick={onMarkReadyForReview} disabled={!canMarkReadyForReview}>
            Nacharbeit prüfbereit
          </Button>
          <Button size="sm" variant="secondary" onClick={onAcceptWithReservation} disabled={!canAcceptWithReservation}>
            Mit Vorbehalt abnehmen
          </Button>
          <Button size="sm" onClick={onAccept} disabled={!canAccept}>
            Abnehmen
          </Button>
          <Button size="sm" variant="secondary" onClick={onClose} disabled={!canClose}>
            Abschließen
          </Button>
        </div>

        {blockers.length > 0 ? (
          <div className="rounded-lg border border-amber-300/50 bg-amber-50/70 p-3 text-sm dark:bg-amber-950/30">
            <p className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              Offene Voraussetzungen für {getStatusLabel(record.status)}
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
