import { Brain } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { getKundenIntelligenceSignals, getNextBestAction } from '@/lib/kunden/intelligence';
import type { KundenRecord } from '@/lib/kunden/types';

type KundenIntelligencePanelProps = {
  record: KundenRecord;
  allRecords: KundenRecord[];
};

function severityClass(severity: 'info' | 'warning' | 'critical'): string {
  if (severity === 'critical') return 'text-red-700';
  if (severity === 'warning') return 'text-amber-700';
  return 'text-sky-700';
}

export function KundenIntelligencePanel({ record, allRecords }: KundenIntelligencePanelProps) {
  const signals = getKundenIntelligenceSignals(record, allRecords);
  const nextBestAction = getNextBestAction(record);

  return (
    <ModuleTableCard icon={Brain} label="Intelligence" title="Next Best Action" hasData>
      <div className="space-y-3">
        <div className="rounded-lg border border-border bg-sidebar/20 p-3 text-sm">
          <p className="font-semibold">Empfehlung</p>
          <p className="text-muted-foreground">{nextBestAction}</p>
        </div>

        <div className="space-y-2">
          {signals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine kritischen Signale erkannt.</p>
          ) : (
            signals.map((signal) => (
              <div key={signal.id} className="rounded-lg border border-border bg-sidebar/20 p-3 text-sm">
                <p className={`font-medium ${severityClass(signal.severity)}`}>{signal.title}</p>
                <p className="text-muted-foreground">{signal.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </ModuleTableCard>
  );
}
