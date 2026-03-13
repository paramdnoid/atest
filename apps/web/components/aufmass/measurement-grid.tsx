import { useMemo } from 'react';
import { DraftingCompass } from 'lucide-react';

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

  if (roomMeasurements.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-white px-6 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <div className="mx-auto h-8 w-8 text-muted-foreground/50">
          <DraftingCompass className="h-8 w-8" />
        </div>
        <p className="mt-3 font-medium">Keine Messwerte im Raum</p>
        <p className="mt-1 text-sm text-muted-foreground">Über &quot;Schnell erfassen&quot; können neue Maße direkt ergänzt werden.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/60 bg-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <Table>
        <TableHeader className="bg-muted/45">
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="sticky left-0 z-10 min-w-40 bg-muted/45 px-3 py-2 xl:min-w-44">
              Leistung
            </TableHead>
            <TableHead scope="col" className="min-w-32 px-3 py-2">
              Formel
            </TableHead>
            <TableHead scope="col" className="px-3 py-2 text-right">
              Netto
            </TableHead>
            <TableHead scope="col" className="px-3 py-2 text-right">
              Brutto
            </TableHead>
            <TableHead scope="col" className="px-3 py-2 text-right">
              Abzug
            </TableHead>
            <TableHead scope="col" className="px-3 py-2">
              Regel
            </TableHead>
            <TableHead scope="col" className="min-w-36 px-3 py-2 max-w-44">
              Notiz
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ entry, position, breakdown, decision }) => {
            const hasException = breakdown.overmeasured > 0 || breakdown.deducted > 0;
            return (
              <TableRow
                key={entry.id}
                className={cn(
                  'transition-colors duration-150',
                  hasException ? 'bg-amber-50/35 hover:bg-amber-50/55' : 'hover:bg-muted/20',
                )}
              >
                <TableCell className="sticky left-0 bg-white px-3 py-2 text-[13px] font-medium">
                  {position?.title ?? entry.label}
                </TableCell>
                <TableCell className="max-w-[18rem] truncate px-3 py-2 font-mono text-[11px]">
                  {entry.formulaAst ? serializeFormulaAst(entry.formulaAst) : entry.formula}
                </TableCell>
                <TableCell className="px-3 py-2 text-right font-mono text-[11px] font-semibold tabular-nums">
                  {breakdown.net.toFixed(2)} {entry.unit}
                </TableCell>
                <TableCell className="px-3 py-2 text-right font-mono text-[11px] tabular-nums">
                  {breakdown.gross.toFixed(2)} {entry.unit}
                </TableCell>
                <TableCell className="px-3 py-2 text-right font-mono text-[11px] tabular-nums">
                  {breakdown.deducted.toFixed(2)} {entry.unit}
                </TableCell>
                <TableCell className="px-3 py-2 text-[11px] text-muted-foreground">
                  {decision ? decision.appliedRuleId : '—'}
                </TableCell>
                <TableCell className="max-w-44 truncate px-3 py-2 text-[12px] text-muted-foreground">
                  {entry.note ?? '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
