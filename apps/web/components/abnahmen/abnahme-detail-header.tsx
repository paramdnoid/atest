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
  PREPARATION: 'Termin, Teilnehmer und Protokollbasis vollständig erfassen.',
  INSPECTION_SCHEDULED: 'Vor-Ort-Begehung dokumentieren und offene Punkte festhalten.',
  INSPECTION_DONE: 'Mängel bewerten oder die Abnahme finalisieren.',
  DEFECTS_OPEN: 'Kritische Mängel priorisiert in die Nacharbeit überführen.',
  REWORK_IN_PROGRESS: 'Fortschritt und Fristen der Nacharbeit steuern.',
  REWORK_READY_FOR_REVIEW: 'Nacharbeit prüfen und Abschlussfreigabe vorbereiten.',
  ACCEPTED_WITH_RESERVATION: 'Vorbehalte überwachen und Restarbeiten nachhalten.',
  ACCEPTED: 'Signaturstatus prüfen und Vorgang revisionssicher abschließen.',
  CLOSED: 'Vorgang revisionssicher abgeschlossen.',
};

type HeaderAction = {
  key: string;
  label: string;
  enabled: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  onClick: () => void;
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
  const primaryAction: HeaderAction | null = canAccept
    ? { key: 'accept', label: 'Abnehmen', enabled: true, variant: 'default', onClick: onAccept }
    : canMarkReadyForReview
      ? {
          key: 'ready',
          label: 'Zur Schlussprüfung freigeben',
          enabled: true,
          variant: 'default',
          onClick: onMarkReadyForReview,
        }
      : canStartRework
        ? { key: 'rework', label: 'Nacharbeit starten', enabled: true, variant: 'default', onClick: onStartRework }
        : canRunInspection
          ? { key: 'inspection', label: 'Begehung abschließen', enabled: true, variant: 'default', onClick: onRunInspection }
          : null;

  const secondaryActions = ([
    { key: 'inspection', label: 'Begehung abschließen', enabled: canRunInspection, onClick: onRunInspection },
    { key: 'rework', label: 'Nacharbeit starten', enabled: canStartRework, onClick: onStartRework },
    {
      key: 'ready',
      label: 'Zur Schlussprüfung freigeben',
      enabled: canMarkReadyForReview,
      onClick: onMarkReadyForReview,
    },
    {
      key: 'reservation',
      label: 'Abnahme mit Vorbehalt',
      enabled: canAcceptWithReservation,
      variant: 'secondary',
      onClick: onAcceptWithReservation,
    },
    { key: 'close', label: 'Abschließen', enabled: canClose, variant: 'secondary', onClick: onClose },
  ] as HeaderAction[]).filter((action) => action.key !== primaryAction?.key);

  return (
    <DashboardCard>
      <DashboardCardHeader icon={ClipboardCheck} label="Abnahmeakte" title={`${record.number} · ${record.projectName}`} />
      <div className="flex flex-col gap-4 p-4 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <AbnahmenStatusBadge status={record.status} />
            <span className="text-sm text-muted-foreground">{helperTextByStatus[record.status]}</span>
          </div>
          {primaryAction ? (
            <Button size="sm" className="min-w-48 justify-center shadow-sm" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          ) : (
            <Button size="sm" className="min-w-48 justify-center shadow-sm" onClick={onAccept} disabled={!canAccept}>
              Abnehmen
            </Button>
          )}
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="flex flex-wrap gap-2">
            {secondaryActions.map((action) => (
              <Button
                key={action.key}
                size="sm"
                variant={action.variant ?? 'outline'}
                className="border-border/70 bg-background/70 hover:bg-background"
                onClick={action.onClick}
                disabled={!action.enabled}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {blockers.length > 0 ? (
          <div className="rounded-xl border border-amber-300/45 bg-amber-50/60 p-3.5 text-sm dark:bg-amber-950/22">
            <p className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              Offene Voraussetzungen für {getStatusLabel(record.status)}
            </p>
            <ul className="mt-2 space-y-1 text-amber-800/85 dark:text-amber-200/85">
              {blockers.map((blocker) => (
                <li key={blocker}>- {blocker}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-emerald-700/90 dark:text-emerald-300/90">
            <CheckCircle2 className="h-4 w-4" />
            Alle Voraussetzungen erfüllt.
          </p>
        )}
      </div>
    </DashboardCard>
  );
}
