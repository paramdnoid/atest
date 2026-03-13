import { AlertTriangle, CheckCircle2, FileCheck2 } from 'lucide-react';

import { AufmassStatusBadge } from '@/components/aufmass/aufmass-status-badge';
import { DashboardCard, DashboardCardHeader } from '@/components/dashboard/dashboard-card';
import { Button } from '@/components/ui/button';
import type { AufmassRecord, AufmassStatus } from '@/lib/aufmass/types';
import { getStatusLabel } from '@/lib/aufmass/state-machine';

type AufmassDetailHeaderProps = {
  record: AufmassRecord;
  blockers: string[];
  canSubmitReview: boolean;
  canApprove: boolean;
  canBill: boolean;
  onSubmitForReview: () => void;
  onOpenApprovalDialog: () => void;
  onBill: () => void;
};

export function AufmassDetailHeader({
  record,
  blockers,
  canSubmitReview,
  canApprove,
  canBill,
  onSubmitForReview,
  onOpenApprovalDialog,
  onBill,
}: AufmassDetailHeaderProps) {
  const statusText: Record<AufmassStatus, string> = {
    DRAFT: 'Erfassen und Zuordnungen prüfen',
    IN_REVIEW: 'Fachliche Prüfung und Freigabe',
    APPROVED: 'Abrechnungsvorschau und Übergabe',
    BILLED: 'Abgeschlossen und revisionssicher',
  };

  return (
    <DashboardCard>
      <DashboardCardHeader icon={FileCheck2} label="Aufmaßakte" title={`${record.number} · ${record.projectName}`} />
      <div className="flex flex-col gap-4 p-4 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <AufmassStatusBadge status={record.status} />
          <span className="text-sm text-muted-foreground">{statusText[record.status]}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onSubmitForReview} disabled={!canSubmitReview}>
            In Prüfung senden
          </Button>
          <Button size="sm" onClick={onOpenApprovalDialog} disabled={!canApprove}>
            Prüfdialog öffnen
          </Button>
          <Button size="sm" variant="secondary" onClick={onBill} disabled={!canBill}>
            Als abgerechnet markieren
          </Button>
        </div>

        {blockers.length > 0 && (
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
        )}

        {blockers.length === 0 && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Alle Voraussetzungen erfüllt.
          </p>
        )}
      </div>
    </DashboardCard>
  );
}
