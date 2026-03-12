import { Badge } from '@/components/ui/badge';
import { getStatusLabel } from '@/lib/aufmass/state-machine';
import type { AufmassStatus } from '@/lib/aufmass/types';

function variantForStatus(status: AufmassStatus): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'DRAFT':
      return 'secondary';
    case 'IN_REVIEW':
      return 'outline';
    case 'APPROVED':
      return 'default';
    case 'BILLED':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function AufmassStatusBadge({ status }: { status: AufmassStatus }) {
  return <Badge variant={variantForStatus(status)}>{getStatusLabel(status)}</Badge>;
}
