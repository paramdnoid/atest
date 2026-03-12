import { Badge } from '@/components/ui/badge';
import type { FormulaQuality } from '@/lib/aufmass/intelligence';
import type { FormulaEvaluation } from '@/lib/aufmass/types';

type FormulaValidationBannerProps = {
  quality: FormulaQuality | null;
  evaluation: FormulaEvaluation;
};

export function FormulaValidationBanner({ quality, evaluation }: FormulaValidationBannerProps) {
  if (!quality && !evaluation.error) return null;

  return (
    <div className="space-y-1">
      {quality && (
        <div className="flex items-center gap-2 pt-1">
          <Badge variant={quality.evaluation.ok ? 'default' : 'destructive'} className="font-mono">
            Formel-Score {quality.score}
          </Badge>
          {quality.evaluation.ok && (
            <p className="text-xs text-muted-foreground">Ergebnis: {quality.evaluation.value?.toFixed(2)}</p>
          )}
        </div>
      )}
      {quality?.warnings.map((warning) => (
        <p key={warning} className="text-xs text-amber-600 dark:text-amber-400">
          {warning}
        </p>
      ))}
      {!quality?.evaluation.ok && quality?.evaluation.error && (
        <p className="text-xs text-destructive">{quality.evaluation.error}</p>
      )}
      {evaluation.error && <p className="text-xs text-destructive">{evaluation.error}</p>}
    </div>
  );
}
