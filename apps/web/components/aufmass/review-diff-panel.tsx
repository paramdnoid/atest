import { CircleAlert } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Badge } from '@/components/ui/badge';
import type { AufmassReviewIssue } from '@/lib/aufmass/types';
import { formatDate } from '@/lib/format';

function severityLabel(severity: AufmassReviewIssue['severity']): string {
  if (severity === 'blocking') return 'Muss behoben werden';
  if (severity === 'warning') return 'Hinweis';
  return 'Info';
}

export function ReviewDiffPanel({ issues }: { issues: AufmassReviewIssue[] }) {
  return (
    <ModuleTableCard
      icon={CircleAlert}
      label="Prüfung"
      title="Abweichungen und Prüfpunkte"
      hasData={issues.length > 0}
      emptyState={{
        icon: <CircleAlert className="h-8 w-8" />,
        title: 'Keine Auffälligkeiten',
        description: 'Alle prüfrelevanten Punkte sind aktuell unauffällig.',
      }}
    >
      <div className="space-y-2">
        {issues.map((issue) => (
          <div key={issue.id} className="rounded-lg border border-border bg-sidebar/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{issue.title}</p>
              <Badge
                variant={issue.severity === 'blocking' ? 'destructive' : issue.severity === 'warning' ? 'outline' : 'secondary'}
              >
                {severityLabel(issue.severity)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{issue.message}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{formatDate(issue.createdAt)}</p>
          </div>
        ))}
      </div>
    </ModuleTableCard>
  );
}
