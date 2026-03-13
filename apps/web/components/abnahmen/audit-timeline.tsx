import { History } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import type { AbnahmeAuditEvent } from '@/lib/abnahmen/types';
import { formatDate } from '@/lib/format';

export function AuditTimeline({ events }: { events: AbnahmeAuditEvent[] }) {
  return (
    <ModuleTableCard
      icon={History}
      label="Historie"
      title="Audit-Trail"
      className="bg-muted/35"
      hasData={events.length > 0}
      emptyState={{
        icon: <History className="h-8 w-8" />,
        title: 'Keine Historie vorhanden',
        description: 'Änderungen und Statuswechsel werden hier revisionssicher angezeigt.',
      }}
    >
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-xl border border-border/70 bg-background/65 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-background/85"
          >
            <p className="text-sm font-semibold">{event.action}</p>
            <p className="text-sm text-muted-foreground">{event.detail}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {event.actor} · {formatDate(event.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </ModuleTableCard>
  );
}
