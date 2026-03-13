import { useMemo } from 'react';
import { DraftingCompass } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AufmassMeasurement, AufmassPosition, AufmassRoom } from '@/lib/aufmass/types';
import { getOvermeasureBreakdown } from '@/lib/aufmass/overmeasure-engine';
import { serializeFormulaAst } from '@/lib/aufmass/formula-builder';
import { cn } from '@/lib/utils';

type MeasurementGridProps = {
  room?: AufmassRoom;
  measurements: AufmassMeasurement[];
  positions: AufmassPosition[];
};

export function MeasurementGrid({ room, measurements, positions }: MeasurementGridProps) {
  const positionsById = useMemo(
    () => new Map(positions.map((position) => [position.id, position])),
    [positions],
  );
  const roomMeasurements = useMemo(
    () => (room ? measurements.filter((entry) => entry.roomId === room.id) : []),
    [room, measurements],
  );
  const rows = useMemo(
    () =>
      roomMeasurements.map((entry) => {
        const position = positionsById.get(entry.positionId);
        const breakdown = getOvermeasureBreakdown(entry, position?.code);
        return {
          entry,
          position,
          breakdown,
          decision: breakdown.decisions[0],
        };
      }),
    [positionsById, roomMeasurements],
  );

  // Mobile Card Component
  const MobileCard = ({ entry, position, breakdown, hasException }: {
    entry: AufmassMeasurement;
    position?: AufmassPosition;
    breakdown: any;
    hasException: boolean;
  }) => (
    <Card className={cn(
      'transition-all duration-200',
      hasException ? 'bg-amber-50/35 border-amber-200/50' : 'bg-background'
    )}>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Leistung</p>
          <p className="text-sm font-semibold">{position?.title ?? entry.label}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Formel</p>
          <p className="font-mono text-xs break-all bg-muted/50 rounded px-2 py-1">
            {entry.formulaAst ? serializeFormulaAst(entry.formulaAst) : entry.formula}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Netto</p>
            <p className="font-mono text-sm font-semibold tabular-nums">
              {breakdown.net.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">{entry.unit}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Brutto</p>
            <p className="font-mono text-sm tabular-nums">
              {breakdown.gross.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">{entry.unit}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Abzug</p>
            <p className="font-mono text-sm tabular-nums">
              {breakdown.deducted.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">{entry.unit}</p>
          </div>
        </div>

        {((breakdown.decisions && breakdown.decisions[0]) || entry.note) && (
          <div className="pt-2 border-t border-border/50 space-y-2">
            {breakdown.decisions && breakdown.decisions[0] && (
              <div>
                <p className="text-xs text-muted-foreground">Regel</p>
                <p className="text-xs">{breakdown.decisions[0].appliedRuleId}</p>
              </div>
            )}
            {entry.note && (
              <div>
                <p className="text-xs text-muted-foreground">Notiz</p>
                <p className="text-xs">{entry.note}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (roomMeasurements.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-background/80 px-6 py-12 text-center">
        <div className="mx-auto h-12 w-12 rounded-lg bg-muted/20 flex items-center justify-center text-muted-foreground/60">
          <DraftingCompass className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-foreground">Keine Messwerte im Raum</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Über "Schnell erfassen" können neue Maße direkt ergänzt werden.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-border/60 bg-background/80">
        <Table>
          <TableHeader className="border-b border-border/60 bg-slate-50/40">
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="sticky left-0 z-10 min-w-40 bg-slate-50/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 xl:min-w-44">
                Leistung
              </TableHead>
              <TableHead scope="col" className="min-w-32 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                Formel
              </TableHead>
              <TableHead scope="col" className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                Netto
              </TableHead>
              <TableHead scope="col" className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                Brutto
              </TableHead>
              <TableHead scope="col" className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                Abzug
              </TableHead>
              <TableHead scope="col" className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                Regel
              </TableHead>
              <TableHead scope="col" className="min-w-36 px-4 py-3 max-w-44 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                Notiz
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-dotted">
            {rows.map(({ entry, position, breakdown, decision }, index) => {
              const hasException = breakdown.overmeasured > 0 || breakdown.deducted > 0;
              return (
                <TableRow
                  key={entry.id}
                  className={cn(
                    'cursor-pointer align-middle transition-colors duration-150',
                    hasException 
                      ? 'bg-amber-50/35 hover:bg-amber-50/55' 
                      : index % 2 === 0 
                        ? 'bg-white hover:bg-slate-50/60' 
                        : 'bg-slate-50/25 hover:bg-slate-100/45'
                  )}
                >
                  <TableCell className="sticky left-0 bg-inherit px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <span>{position?.title ?? entry.label}</span>
                      {hasException && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          Anpassung
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[18rem] truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                    {entry.formulaAst ? serializeFormulaAst(entry.formulaAst) : entry.formula}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-xs font-semibold tabular-nums text-slate-800">
                    {breakdown.net.toFixed(2)} {entry.unit}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {breakdown.gross.toFixed(2)} {entry.unit}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {breakdown.deducted.toFixed(2)} {entry.unit}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    {decision?.appliedRuleId ?? '—'}
                  </TableCell>
                  <TableCell className="max-w-44 truncate px-4 py-3 text-xs text-muted-foreground">
                    {entry.note ?? '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {rows.map(({ entry, position, breakdown }) => {
          const hasException = breakdown.overmeasured > 0 || breakdown.deducted > 0;
          return (
            <MobileCard
              key={entry.id}
              entry={entry}
              position={position}
              breakdown={breakdown}
              hasException={hasException}
            />
          );
        })}
      </div>
    </>
  );
}
