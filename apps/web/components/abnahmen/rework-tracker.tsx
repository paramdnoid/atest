import { Wrench } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Badge } from '@/components/ui/badge';
import type { DefectEntry, ReworkEntry } from '@/lib/abnahmen/types';
import { formatDate } from '@/lib/format';

type ReworkTrackerProps = {
  rework: ReworkEntry[];
  defects: DefectEntry[];
};

function reworkStatusLabel(status: ReworkEntry['status']): string {
  if (status === 'OPEN') return 'Offen';
  if (status === 'IN_PROGRESS') return 'In Bearbeitung';
  if (status === 'DONE') return 'Fertig';
  if (status === 'APPROVED') return 'Freigegeben';
  if (status === 'REOPENED') return 'Wieder geöffnet';
  return status;
}

export function ReworkTracker({ rework, defects }: ReworkTrackerProps) {
  return (
    <ModuleTableCard
      icon={Wrench}
      label="Nacharbeit"
      title="Abarbeitung und Freigaben"
      className="bg-muted/35"
      hasData={rework.length > 0}
      emptyState={{
        icon: <Wrench className="h-8 w-8" />,
        title: 'Keine Nacharbeit angelegt',
        description: 'Sobald Mängel zugeordnet werden, erscheint hier der Fortschritt.',
      }}
    >
      <div className="space-y-2">
        {rework.map((entry) => {
          const defect = defects.find((item) => item.id === entry.defectId);
          return (
            <div
              key={entry.id}
              className="rounded-xl border border-border/70 bg-background/65 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-background/85"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{defect?.title ?? 'Unbekannter Mangel'}</p>
                <Badge variant={entry.status === 'REOPENED' ? 'destructive' : 'outline'}>
                  {reworkStatusLabel(entry.status)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Verantwortlich: {entry.owner}</p>
              <div className="mt-2 flex flex-wrap gap-3 font-mono text-xs text-muted-foreground">
                <span>Start: {entry.startedAt ? formatDate(entry.startedAt) : '—'}</span>
                <span>Ende: {entry.finishedAt ? formatDate(entry.finishedAt) : '—'}</span>
                <span>Freigabe: {entry.approvedAt ? formatDate(entry.approvedAt) : '—'}</span>
              </div>
              {entry.notes.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                  {entry.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </ModuleTableCard>
  );
}
