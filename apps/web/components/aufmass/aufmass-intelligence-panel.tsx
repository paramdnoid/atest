import { Brain, TriangleAlert } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Badge } from '@/components/ui/badge';
import { getIntelligenceSnapshot } from '@/lib/aufmass/intelligence';
import type { AufmassRecord } from '@/lib/aufmass/types';

function getScoreVariant(score: number): 'default' | 'outline' | 'secondary' {
  if (score >= 80) return 'default';
  if (score >= 60) return 'outline';
  return 'secondary';
}

function getConfidenceVariant(confidence: 'low' | 'medium' | 'high'): 'secondary' | 'outline' | 'default' {
  if (confidence === 'high') return 'default';
  if (confidence === 'medium') return 'outline';
  return 'secondary';
}

export function AufmassIntelligencePanel({
  record,
  allRecords,
}: {
  record: AufmassRecord;
  allRecords?: AufmassRecord[];
}) {
  const snapshot = getIntelligenceSnapshot(record, allRecords ?? [record]);

  return (
    <ModuleTableCard icon={Brain} label="Intelligence" title="Qualitäts- und Prüfreifeanalyse" hasData>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-border bg-sidebar/30 p-3">
          <p className="text-sm font-medium">Readiness Score</p>
          <Badge variant={getScoreVariant(snapshot.readinessScore)} className="font-mono">
            {snapshot.readinessScore}/100
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Next Best Actions
          </p>
          {snapshot.nextBestActions.map((action) => (
            <p key={action} className="text-sm text-muted-foreground">
              - {action}
            </p>
          ))}
        </div>

        {snapshot.blockers.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
              <TriangleAlert className="h-4 w-4" />
              Blocker
            </p>
            <div className="mt-1 space-y-1 text-sm text-destructive">
              {snapshot.blockers.map((blocker) => (
                <p key={blocker}>- {blocker}</p>
              ))}
            </div>
          </div>
        )}

        {snapshot.forecast.positions.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Predictive Aufwand/Material
              </p>
              <Badge
                variant={getConfidenceVariant(snapshot.forecast.totals.confidence)}
                className="font-mono text-[11px]"
              >
                Confidence {snapshot.forecast.totals.confidence.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Gesamtaufwand ~ {snapshot.forecast.totals.effortHours.toFixed(2)} h · Material ~{' '}
              {snapshot.forecast.totals.materialQuantity.toFixed(2)} Einheiten
            </p>
            {snapshot.forecast.positions.slice(0, 4).map((forecast) => (
              <div key={forecast.positionId} className="rounded-md border border-border bg-sidebar/20 p-2">
                <p className="text-sm font-medium">
                  {forecast.positionCode} · {forecast.positionTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  Menge {forecast.quantity.toFixed(2)} {forecast.unit} · Aufwand {forecast.predictedEffortHours.toFixed(2)} h
                  ({forecast.effortInterval[0].toFixed(2)}-{forecast.effortInterval[1].toFixed(2)} h)
                </p>
                <p className="text-xs text-muted-foreground">
                  Material {forecast.predictedMaterialQuantity.toFixed(2)} ({forecast.materialInterval[0].toFixed(2)}-
                  {forecast.materialInterval[1].toFixed(2)}) · Samples {forecast.sampleCount}
                </p>
                {forecast.riskNotes.length > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">{forecast.riskNotes[0]}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {snapshot.signals.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Plausibilitätssignale
            </p>
            {snapshot.signals.slice(0, 4).map((signal) => (
              <p key={signal.positionId} className="text-sm text-muted-foreground">
                - Position {signal.positionId}: µ={signal.mean.toFixed(2)}, σ={signal.deviation.toFixed(2)}
                {signal.outlierCount > 0 ? `, Ausreißer=${signal.outlierCount}` : ', keine Ausreißer'}
              </p>
            ))}
          </div>
        )}
      </div>
    </ModuleTableCard>
  );
}
