'use client';

import { Link2 } from 'lucide-react';
import { useMemo } from 'react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AufmassPosition, AufmassPositionMapping, AufmassRoom } from '@/lib/aufmass/types';
import { formatDate } from '@/lib/format';

type PositionMappingTableProps = {
  mappings: AufmassPositionMapping[];
  positions: AufmassPosition[];
  rooms: AufmassRoom[];
  embedded?: boolean;
};

function MappingTableContent({ mappings, positions, rooms }: Pick<PositionMappingTableProps, 'mappings' | 'positions' | 'rooms'>) {
  const positionsById = useMemo(() => new Map(positions.map((entry) => [entry.id, entry])), [positions]);
  const roomsById = useMemo(() => new Map(rooms.map((entry) => [entry.id, entry])), [rooms]);

  if (mappings.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Zuordnung. Mindestens eine Zuordnung ist für den Prüfstatus erforderlich.</p>;
  }

  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="px-4 py-3">Position</TableHead>
          <TableHead className="px-4 py-3">Raum</TableHead>
          <TableHead className="px-4 py-3">Zuordnung</TableHead>
          <TableHead className="px-4 py-3">Zeit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mappings.map((mapping) => {
          const position = positionsById.get(mapping.positionId);
          const room = roomsById.get(mapping.roomId);
          return (
            <TableRow key={mapping.id}>
              <TableCell className="px-4 py-3">
                <p className="font-mono text-xs">{position?.code}</p>
                <p className="text-sm">{position?.title ?? 'Unbekannte Position'}</p>
              </TableCell>
              <TableCell className="px-4 py-3">
                {room ? `${room.level} · ${room.name}` : 'Unbekannter Raum'}
              </TableCell>
              <TableCell className="px-4 py-3 text-muted-foreground">{mapping.mappedBy}</TableCell>
              <TableCell className="px-4 py-3 text-muted-foreground">{formatDate(mapping.mappedAt)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function PositionMappingTable({ mappings, positions, rooms, embedded = false }: PositionMappingTableProps) {
  if (embedded) {
    return <MappingTableContent mappings={mappings} positions={positions} rooms={rooms} />;
  }

  return (
    <ModuleTableCard
      icon={Link2}
      label="Positionsmapping"
      title="LV-Positionen und Raumzuordnung"
      hasData={mappings.length > 0}
      emptyState={{
        icon: <Link2 className="h-8 w-8" />,
        title: 'Noch keine Zuordnung',
        description: 'Mindestens eine Zuordnung ist für den Prüfstatus erforderlich.',
      }}
    >
      <MappingTableContent mappings={mappings} positions={positions} rooms={rooms} />
    </ModuleTableCard>
  );
}
