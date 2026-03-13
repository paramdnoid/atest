import { SemanticBadge, type SemanticBadgeTone } from '@/components/dashboard/semantic-badge';
import type { KundenStatus } from '@/lib/kunden/types';

const statusConfig: Record<KundenStatus, { label: string; tone: SemanticBadgeTone }> = {
  LEAD: {
    label: 'Lead',
    tone: 'info',
  },
  AKTIV: {
    label: 'Aktiv',
    tone: 'success',
  },
  RUHEND: {
    label: 'Ruhend',
    tone: 'warning',
  },
  ARCHIVIERT: {
    label: 'Archiviert',
    tone: 'neutral',
  },
};

export function KundenStatusBadge({ status }: { status: KundenStatus }) {
  const config = statusConfig[status];
  return <SemanticBadge label={config.label} tone={config.tone} />;
}
