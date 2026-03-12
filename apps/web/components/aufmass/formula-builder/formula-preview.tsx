import type { AufmassUnit } from '@/lib/aufmass/types';

type FormulaPreviewProps = {
  formulaText: string;
  quantity: number;
  unit: AufmassUnit;
};

export function FormulaPreview({ formulaText, quantity, unit }: FormulaPreviewProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">Builder-Formel: {formulaText || '—'}</p>
      <label className="text-sm font-medium">Berechnete Menge ({unit})</label>
      <div className="rounded-md border border-input bg-muted/40 px-3 py-2 font-mono text-sm">
        {quantity.toFixed(2)}
      </div>
    </div>
  );
}
