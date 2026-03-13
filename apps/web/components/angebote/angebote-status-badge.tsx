import { SemanticBadge, type SemanticBadgeTone } from '@/components/dashboard/semantic-badge';
import type { QuoteStatus } from '@/lib/angebote/types';

const statusConfig: Record<QuoteStatus, { label: string; tone: SemanticBadgeTone }> = {
  DRAFT: {
    label: 'Entwurf',
    tone: 'neutral',
  },
  READY_FOR_REVIEW: {
    label: 'Pruefbereit',
    tone: 'info',
  },
  IN_APPROVAL: {
    label: 'In Freigabe',
    tone: 'warning',
  },
  APPROVED: {
    label: 'Freigegeben',
    tone: 'success',
  },
  SENT: {
    label: 'Versendet',
    tone: 'accent',
  },
  CONVERTED_TO_ORDER: {
    label: 'Zu Auftrag',
    tone: 'success',
  },
  ARCHIVED: {
    label: 'Archiviert',
    tone: 'neutral',
  },
};

export function AngeboteStatusBadge({ status }: { status: QuoteStatus }) {
  const config = statusConfig[status];
  return <SemanticBadge label={config.label} tone={config.tone} />;
}
