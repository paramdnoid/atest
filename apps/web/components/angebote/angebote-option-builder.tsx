import { Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getQuoteTotals } from '@/lib/angebote/pricing';
import type { QuoteOptionVariant, QuoteRecord } from '@/lib/angebote/types';

type AngeboteOptionBuilderProps = {
  record: QuoteRecord;
  onSelectOption: (option: QuoteOptionVariant) => void;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function AngeboteOptionBuilder({ record, onSelectOption }: AngeboteOptionBuilderProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {record.options.map((option) => {
        const totals = getQuoteTotals(record, option.includedPositionIds);
        const selected = record.selectedOptionId === option.id;
        return (
          <div
            key={option.id}
            className={[
              'rounded-xl border p-4',
              selected ? 'border-primary bg-primary/5' : 'border-border bg-card',
            ].join(' ')}
          >
            <div className="flex items-center justify-between">
              <p className="font-medium">{option.label}</p>
              {option.recommended && (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Empfohlen
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
            <div className="mt-4 space-y-1 text-sm">
              <p>
                Netto: <span className="font-medium">{formatCurrency(totals.totalNet)}</span>
              </p>
              <p>
                Marge: <span className="font-medium">{totals.marginPercent.toFixed(1)}%</span>
              </p>
              <p className="text-muted-foreground">{option.includedPositionIds.length} Positionen</p>
            </div>
            <Button className="mt-4 w-full" variant={selected ? 'default' : 'outline'} onClick={() => onSelectOption(option)}>
              {selected ? 'Aktiv' : 'Option aktivieren'}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
