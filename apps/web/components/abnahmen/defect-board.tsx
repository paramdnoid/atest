import { AlertCircle } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Badge } from '@/components/ui/badge';
import type { DefectEntry } from '@/lib/abnahmen/types';
import { formatDate } from '@/lib/format';

function severityVariant(severity: DefectEntry['severity']): 'destructive' | 'default' | 'outline' {
  if (severity === 'critical') return 'destructive';
  if (severity === 'major') return 'default';
  return 'outline';
}

export function DefectBoard({ defects }: { defects: DefectEntry[] }) {
  return (
    <ModuleTableCard
      icon={AlertCircle}
      label="Mängelboard"
      title="Erfassung, Priorität und Fälligkeiten"
      hasData={defects.length > 0}
      emptyState={{
        icon: <AlertCircle className="h-8 w-8" />,
        title: 'Keine Mängel vorhanden',
        description: 'Aktuell sind keine offenen Mängel dokumentiert.',
      }}
    >
      <div className="space-y-2">
        {defects.map((defect) => (
          <div key={defect.id} className="rounded-lg border border-border bg-sidebar/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs text-muted-foreground">{defect.ref}</p>
              <div className="flex items-center gap-2">
                <Badge variant={severityVariant(defect.severity)}>{defect.severity}</Badge>
                <Badge variant="outline">{defect.status}</Badge>
              </div>
            </div>
            <p className="mt-1 text-sm font-semibold">{defect.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{defect.description}</p>
            <div className="mt-2 flex flex-wrap gap-3 font-mono text-xs text-muted-foreground">
              <span>Ort: {defect.location}</span>
              <span>Frist: {defect.dueDate ? formatDate(defect.dueDate) : '—'}</span>
              <span>Belege: {defect.evidence.length}</span>
              <span>Reopen: {defect.reopenCount}</span>
            </div>
          </div>
        ))}
      </div>
    </ModuleTableCard>
  );
}
