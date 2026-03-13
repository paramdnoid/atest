import { Brain, CircleAlert, Lightbulb } from 'lucide-react';

import { getQuoteIntelligenceSignals } from '@/lib/angebote/intelligence';
import type { QuoteRecord } from '@/lib/angebote/types';

export function AngeboteIntelligencePanel({
  record,
  allRecords,
}: {
  record: QuoteRecord;
  allRecords: QuoteRecord[];
}) {
  const signals = getQuoteIntelligenceSignals(record, allRecords);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <p className="font-medium">Angebots-Intelligence</p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {signals.length} Hinweis{signals.length === 1 ? '' : 'e'}
        </span>
      </div>
      {signals.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Keine kritischen Hinweise. Angebot wirkt stimmig.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className={[
                'rounded-md border px-3 py-2 text-sm',
                signal.severity === 'blocking'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : signal.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-blue-200 bg-blue-50 text-blue-800',
              ].join(' ')}
            >
              <p className="flex items-center gap-2 font-medium">
                {signal.severity === 'info' ? <Lightbulb className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
                {signal.title}
              </p>
              <p className="mt-1">{signal.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
