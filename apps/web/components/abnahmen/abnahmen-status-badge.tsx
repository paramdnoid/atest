import { Badge } from '@/components/ui/badge';
import { getStatusLabel } from '@/lib/abnahmen/selectors';
import type { AbnahmeStatus } from '@/lib/abnahmen/types';

function variantForStatus(status: AbnahmeStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'PREPARATION':
    case 'INSPECTION_SCHEDULED':
      return 'secondary';
    case 'INSPECTION_DONE':
    case 'REWORK_READY_FOR_REVIEW':
      return 'outline';
    case 'DEFECTS_OPEN':
      return 'destructive';
    case 'REWORK_IN_PROGRESS':
    case 'ACCEPTED_WITH_RESERVATION':
      return 'default';
    case 'ACCEPTED':
    case 'CLOSED':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function AbnahmenStatusBadge({ status }: { status: AbnahmeStatus }) {
  return <Badge variant={variantForStatus(status)}>{getStatusLabel(status)}</Badge>;
}
