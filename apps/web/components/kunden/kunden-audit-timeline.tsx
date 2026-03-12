import { History } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { formatDate } from '@/lib/format';
import type { KundenActivity } from '@/lib/kunden/types';

export function KundenAuditTimeline({ events }: { events: KundenActivity[] }) {
  return (
    <ModuleTableCard
      icon={History}
      label="Historie"
      title="Audit-Timeline"
      hasData={events.length > 0}
      emptyState={{
        icon: <History className="h-8 w-8" />,
        title: 'Keine Historie vorhanden',
        description: 'Aenderungen und Statuswechsel werden hier revisionssicher angezeigt.',
      }}
    >
      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.id} className="rounded-lg border border-border bg-sidebar/30 p-3">
            <p className="text-sm font-semibold">{event.title}</p>
            {event.payload ? <p className="text-sm text-muted-foreground">{event.payload}</p> : null}
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {event.createdBy} · {formatDate(event.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </ModuleTableCard>
  );
}
