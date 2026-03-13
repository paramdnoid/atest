import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardCheck, MapPin, UserRound, Wrench } from 'lucide-react';

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
  const lastUpdate = new Date(record.updatedAt).toLocaleString('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

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
        <div className="rounded-lg border border-border/65 bg-background/60 px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <AbnahmenStatusBadge status={record.status} />
              <span className="text-sm text-muted-foreground">{helperTextByStatus[record.status]}</span>
            </div>
            <p className="text-xs text-muted-foreground">Zuletzt aktualisiert: {lastUpdate}</p>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-white px-2 py-1 text-xs text-muted-foreground">
              <UserRound className="h-3.5 w-3.5 text-foreground/70" />
              {record.customerName}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-white px-2 py-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-foreground/70" />
              {record.siteName}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-white px-2 py-1 text-xs text-muted-foreground">
              <Wrench className="h-3.5 w-3.5 text-foreground/70" />
              {record.tradeLabel}
            </span>
            {record.nextInspectionDate ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-white px-2 py-1 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5 text-foreground/70" />
                Nächste Prüfung: {new Date(record.nextInspectionDate).toLocaleDateString('de-DE')}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 2xl:grid-cols-[auto_minmax(0,1fr)] 2xl:items-start">
          <div className="w-full 2xl:w-auto">
            {primaryAction ? (
              <Button size="sm" className="w-full min-w-52 justify-center shadow-sm 2xl:w-auto" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full min-w-52 justify-center shadow-sm 2xl:w-auto"
                onClick={onAccept}
                disabled={!canAccept}
              >
                Abnehmen
              </Button>
            )}
          </div>
          <div className="grid gap-2 rounded-lg border border-border/60 bg-background/55 p-2 2xl:flex 2xl:flex-wrap">
            {secondaryActions.map((action) => (
              <Button
                key={action.key}
                size="sm"
                variant={action.variant ?? 'outline'}
                className="w-full border-border/70 bg-background/70 hover:bg-background 2xl:w-auto"
                onClick={action.onClick}
                disabled={!action.enabled}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {blockers.length > 0 ? (
          <div className="rounded-lg border border-amber-300/45 bg-amber-50/60 p-3.5 text-sm dark:bg-amber-950/22">
            <p className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              Offene Voraussetzungen für {getStatusLabel(record.status)}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-800/85 dark:text-amber-200/85">
              {blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
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
