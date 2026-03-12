import { CopyCheck } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Button } from '@/components/ui/button';
import type { DuplicateCandidate } from '@/lib/kunden/types';

type DuplicateReviewDrawerProps = {
  duplicates: DuplicateCandidate[];
  onResolve: (id: string, resolution: 'MERGED' | 'DISMISSED') => void;
};

export function DuplicateReviewDrawer({ duplicates, onResolve }: DuplicateReviewDrawerProps) {
  return (
    <ModuleTableCard
      icon={CopyCheck}
      label="Duplikate"
      title="Duplicate Review"
      hasData={duplicates.length > 0}
      emptyState={{
        icon: <CopyCheck className="h-8 w-8" />,
        title: 'Keine Duplikate erkannt',
        description: 'Keine offenen Duplicate Candidates im aktuellen Datensatz.',
      }}
    >
      <div className="space-y-2">
        {duplicates.map((candidate) => (
          <div key={candidate.id} className="rounded-lg border border-border bg-sidebar/20 p-3 text-sm">
            <p className="font-medium">
              Match Score {(candidate.score * 100).toFixed(0)}% · {candidate.leftEntityId} vs.{' '}
              {candidate.rightEntityId}
            </p>
            <p className="text-xs text-muted-foreground">{candidate.reasons.join(' · ')}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onResolve(candidate.id, 'DISMISSED')}>
                Verwerfen
              </Button>
              <Button size="sm" onClick={() => onResolve(candidate.id, 'MERGED')}>
                Als Merge markieren
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ModuleTableCard>
  );
}
