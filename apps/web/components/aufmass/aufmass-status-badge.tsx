import { SemanticBadge, type SemanticBadgeTone } from '@/components/dashboard/semantic-badge';
import { getStatusLabel } from '@/lib/aufmass/state-machine';
import type { AufmassStatus } from '@/lib/aufmass/types';

function toneForStatus(status: AufmassStatus): SemanticBadgeTone {
  switch (status) {
    case 'DRAFT':
      return 'neutral';
    case 'IN_REVIEW':
      return 'info';
    case 'APPROVED':
      return 'success';
    case 'BILLED':
      return 'accent';
    default:
      return 'neutral';
  }
}

export function AufmassStatusBadge({ status }: { status: AufmassStatus }) {
  return <SemanticBadge label={getStatusLabel(status)} tone={toneForStatus(status)} />;
}
