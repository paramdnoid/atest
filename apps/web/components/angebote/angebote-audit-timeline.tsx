import { formatDate } from '@/lib/format';
import type { QuoteAuditEvent } from '@/lib/angebote/types';

export function AngeboteAuditTimeline({ events }: { events: QuoteAuditEvent[] }) {
  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={event.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{event.action}</p>
            <p className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
          <p className="mt-1 text-xs text-muted-foreground">Akteur: {event.actor}</p>
        </div>
      ))}
    </div>
  );
}
