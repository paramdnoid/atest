import { Home } from 'lucide-react';

import { DashboardCard, DashboardCardHeader } from '@/components/dashboard/dashboard-card';
import { cn } from '@/lib/utils';
import type { AufmassRoom } from '@/lib/aufmass/types';

type RoomTreePanelProps = {
  rooms: AufmassRoom[];
  activeRoomId?: string;
  onSelectRoom: (roomId: string) => void;
};

export function RoomTreePanel({ rooms, activeRoomId, onSelectRoom }: RoomTreePanelProps) {
  return (
    <DashboardCard>
      <DashboardCardHeader icon={Home} label="Objektstruktur" title="Gebäude / Etage / Raum" />
      <div className="space-y-1 p-4 pt-1">
        {rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelectRoom(room.id)}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-left transition-colors',
              room.id === activeRoomId
                ? 'border-primary/40 bg-primary/10'
                : 'border-border bg-sidebar/30 hover:bg-sidebar/50',
            )}
          >
            <p className="text-xs text-muted-foreground">
              {room.building} · {room.level}
            </p>
            <p className="text-sm font-medium">{room.name}</p>
            <p className="text-xs text-muted-foreground">
              {room.areaM2 ? `${room.areaM2.toFixed(1)} m²` : 'Ohne Flächenangabe'}
            </p>
          </button>
        ))}
      </div>
    </DashboardCard>
  );
}
