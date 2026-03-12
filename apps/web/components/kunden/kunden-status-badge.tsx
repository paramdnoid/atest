import { Badge } from '@/components/ui/badge';
import type { KundenStatus } from '@/lib/kunden/types';

const statusConfig: Record<KundenStatus, { label: string; className: string }> = {
  LEAD: { label: 'Lead', className: 'bg-sky-100 text-sky-700' },
  AKTIV: { label: 'Aktiv', className: 'bg-emerald-100 text-emerald-700' },
  RUHEND: { label: 'Ruhend', className: 'bg-amber-100 text-amber-700' },
  ARCHIVIERT: { label: 'Archiviert', className: 'bg-zinc-200 text-zinc-700' },
};

export function KundenStatusBadge({ status }: { status: KundenStatus }) {
  const config = statusConfig[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}
