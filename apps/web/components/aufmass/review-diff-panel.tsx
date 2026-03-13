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

type ReviewDiffPanelProps = {
  issues: AufmassReviewIssue[];
  activeIssueId?: string | null;
  onJumpToIssue?: (issue: AufmassReviewIssue) => void;
  embedded?: boolean;
};

function ReviewDiffList({
  issues,
  activeIssueId,
  onJumpToIssue,
}: Pick<ReviewDiffPanelProps, 'issues' | 'activeIssueId' | 'onJumpToIssue'>) {
  if (issues.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Auffälligkeiten. Alle prüfrelevanten Punkte sind unauffällig.</p>;
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <div
          key={issue.id}
          id={`review-issue-${issue.id}`}
          tabIndex={-1}
          className={`rounded-lg border bg-sidebar/30 p-3 ${activeIssueId === issue.id ? 'border-primary/40 ring-2 ring-primary/20' : 'border-border'}`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{issue.title}</p>
            <Badge
              variant={issue.severity === 'blocking' ? 'destructive' : issue.severity === 'warning' ? 'outline' : 'secondary'}
            >
              {severityLabel(issue.severity)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{issue.message}</p>
          {issue.roomId || issue.positionId ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {issue.roomId ? `Raum: ${issue.roomId}` : ''} {issue.positionId ? `· Position: ${issue.positionId}` : ''}
            </p>
          ) : null}
          <p className="mt-1 font-mono text-xs text-muted-foreground">{formatDate(issue.createdAt)}</p>
          {onJumpToIssue ? (
            <button
              type="button"
              className="mt-2 text-xs font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => onJumpToIssue(issue)}
            >
              Zum Messwert springen
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ReviewDiffPanel({ issues, activeIssueId, onJumpToIssue, embedded = false }: ReviewDiffPanelProps) {
  if (embedded) {
    return <ReviewDiffList issues={issues} activeIssueId={activeIssueId} onJumpToIssue={onJumpToIssue} />;
  }

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
      <ReviewDiffList issues={issues} activeIssueId={activeIssueId} onJumpToIssue={onJumpToIssue} />
    </ModuleTableCard>
  );
}
