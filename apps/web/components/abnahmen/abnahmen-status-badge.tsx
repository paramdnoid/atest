import { SemanticBadge, type SemanticBadgeTone } from '@/components/dashboard/semantic-badge';
import { getStatusLabel } from '@/lib/abnahmen/selectors';
import type { AbnahmeStatus } from '@/lib/abnahmen/types';

function toneForStatus(status: AbnahmeStatus): SemanticBadgeTone {
  switch (status) {
    case 'PREPARATION':
    case 'INSPECTION_SCHEDULED':
      return 'neutral';
    case 'INSPECTION_DONE':
    case 'REWORK_READY_FOR_REVIEW':
      return 'info';
    case 'DEFECTS_OPEN':
      return 'danger';
    case 'REWORK_IN_PROGRESS':
    case 'ACCEPTED_WITH_RESERVATION':
      return 'warning';
    case 'ACCEPTED':
    case 'CLOSED':
      return 'success';
    default:
      return 'neutral';
  }
}

export function AbnahmenStatusBadge({ status }: { status: AbnahmeStatus }) {
  return <SemanticBadge label={getStatusLabel(status)} tone={toneForStatus(status)} />;
}
