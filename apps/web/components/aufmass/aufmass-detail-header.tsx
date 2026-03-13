import { AufmassStatusBadge } from '@/components/aufmass/aufmass-status-badge';
import type { AufmassRecord, AufmassStatus } from '@/lib/aufmass/types';

type AufmassDetailHeaderProps = {
  record: AufmassRecord;
  inline?: boolean;
};

export function AufmassDetailHeader({ record, inline = false }: AufmassDetailHeaderProps) {
  const helperTextByStatus: Record<AufmassStatus, string> = {
    DRAFT: 'Erfassen und Zuordnungen prüfen',
    IN_REVIEW: 'Fachliche Prüfung und Freigabe',
    APPROVED: 'Abrechnungsvorschau und Übergabe',
    BILLED: 'Abgeschlossen und revisionssicher',
  };

  if (inline) {
    return (
      <div className="flex items-center whitespace-nowrap">
        <AufmassStatusBadge status={record.status} />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-white px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <AufmassStatusBadge status={record.status} />
        <span className="text-sm text-muted-foreground">{helperTextByStatus[record.status]}</span>
      </div>
    </div>
  );
}
