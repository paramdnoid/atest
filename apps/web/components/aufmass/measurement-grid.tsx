import { useMemo } from 'react';
import { DraftingCompass } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
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

  return (
    <ModuleTableCard
      icon={DraftingCompass}
      label="Erfassung"
      title={room ? `Messwerte · ${room.name}` : 'Messwerte'}
      hasData={roomMeasurements.length > 0}
      emptyState={{
        icon: <DraftingCompass className="h-8 w-8" />,
        title: 'Keine Messwerte im Raum',
        description: 'Über "Schnell erfassen" können neue Maße direkt ergänzt werden.',
      }}
    >
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4 py-3">Leistung</TableHead>
            <TableHead className="px-4 py-3">Formel</TableHead>
            <TableHead className="px-4 py-3">Brutto</TableHead>
            <TableHead className="px-4 py-3">Abzug</TableHead>
            <TableHead className="px-4 py-3">Netto</TableHead>
            <TableHead className="px-4 py-3">Regel</TableHead>
            <TableHead className="px-4 py-3">Notiz</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ entry, position, breakdown, decision }) => {
            return (
              <TableRow key={entry.id}>
                <TableCell className="px-4 py-3 text-sm">{position?.title ?? entry.label}</TableCell>
                <TableCell className="px-4 py-3 font-mono text-xs">
                  {entry.formulaAst ? serializeFormulaAst(entry.formulaAst) : entry.formula}
                </TableCell>
                <TableCell className="px-4 py-3 font-mono text-xs">
                  {breakdown.gross.toFixed(2)} {entry.unit}
                </TableCell>
                <TableCell className="px-4 py-3 font-mono text-xs">
                  {breakdown.deducted.toFixed(2)} {entry.unit}
                </TableCell>
                <TableCell className="px-4 py-3 font-mono text-xs">
                  {breakdown.net.toFixed(2)} {entry.unit}
                </TableCell>
                <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                  {decision ? decision.appliedRuleId : '—'}
                </TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground">
                  {entry.note ?? '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ModuleTableCard>
  );
}
