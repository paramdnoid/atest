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

const severityOrder: Array<AufmassReviewIssue['severity']> = ['blocking', 'warning', 'info'];

function ReviewDiffList({
  issues,
  activeIssueId,
  onJumpToIssue,
}: Pick<ReviewDiffPanelProps, 'issues' | 'activeIssueId' | 'onJumpToIssue'>) {
  if (issues.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Auffälligkeiten. Alle prüfrelevanten Punkte sind unauffällig.</p>;
  }

  const groupedBySeverity = severityOrder
    .map((severity) => ({
      severity,
      items: issues.filter((issue) => issue.severity === severity),
    }))
    .filter((group) => group.items.length > 0);

  const groupKey = (issue: AufmassReviewIssue) => `${issue.roomId ?? 'ohne-raum'}:${issue.positionId ?? 'ohne-position'}`;

  return (
    <div className="space-y-2">
      {groupedBySeverity.map((severityGroup) => {
        const groupedByLocation = severityGroup.items.reduce<Record<string, AufmassReviewIssue[]>>((acc, issue) => {
          const key = groupKey(issue);
          acc[key] = acc[key] ? [...acc[key], issue] : [issue];
          return acc;
        }, {});

        return (
          <section key={severityGroup.severity} className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {severityLabel(severityGroup.severity)} ({severityGroup.items.length})
            </p>
            {Object.entries(groupedByLocation).map(([locationKey, locationIssues]) => {
              const roomId = locationIssues[0]?.roomId;
              const positionId = locationIssues[0]?.positionId;
              return (
                <div key={locationKey} className="rounded-lg border border-border/60 bg-sidebar/20 p-2.5">
                  {(roomId || positionId) ? (
                    <p className="mb-2 text-[11px] text-muted-foreground">
                      {roomId ? `Raum: ${roomId}` : 'Raum: —'} {positionId ? `· Position: ${positionId}` : ''}
                    </p>
                  ) : null}
                  <div className="space-y-2">
                    {locationIssues.map((issue) => (
                      <div
                        key={issue.id}
                        id={`review-issue-${issue.id}`}
                        tabIndex={-1}
                        className={`rounded-lg border bg-sidebar/30 p-3 ${activeIssueId === issue.id ? 'border-primary/40 ring-2 ring-primary/20' : 'border-border'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{issue.title}</p>
                          <Badge
                            variant={
                              issue.severity === 'blocking' ? 'destructive' : issue.severity === 'warning' ? 'outline' : 'secondary'
                            }
                          >
                            {severityLabel(issue.severity)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{issue.message}</p>
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
                </div>
              );
            })}
          </section>
        );
      })}
      {issues.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Erledigt, sobald keine blockierenden Einträge mehr vorhanden sind.
        </p>
      ) : null}
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
