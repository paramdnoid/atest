import { Badge } from '@/components/ui/badge';
import type { QuoteStatus } from '@/lib/angebote/types';

const statusConfig: Record<QuoteStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Entwurf',
    className: 'border-border text-foreground',
  },
  READY_FOR_REVIEW: {
    label: 'Pruefbereit',
    className: 'border-blue-300 bg-blue-50 text-blue-700',
  },
  IN_APPROVAL: {
    label: 'In Freigabe',
    className: 'border-amber-300 bg-amber-50 text-amber-700',
  },
  APPROVED: {
    label: 'Freigegeben',
    className: 'border-green-300 bg-green-50 text-green-700',
  },
  SENT: {
    label: 'Versendet',
    className: 'border-indigo-300 bg-indigo-50 text-indigo-700',
  },
  CONVERTED_TO_ORDER: {
    label: 'Zu Auftrag',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  },
  ARCHIVED: {
    label: 'Archiviert',
    className: 'border-zinc-300 bg-zinc-100 text-zinc-700',
  },
};

export function AngeboteStatusBadge({ status }: { status: QuoteStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
