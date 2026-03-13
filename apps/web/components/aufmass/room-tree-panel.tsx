import { Home } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { AufmassRoom } from '@/lib/aufmass/types';

type RoomTreePanelProps = {
  rooms: AufmassRoom[];
  activeRoomId?: string;
  onSelectRoom: (roomId: string) => void;
};

export function RoomTreePanel({ rooms, activeRoomId, onSelectRoom }: RoomTreePanelProps) {
  const activeIndex = rooms.findIndex((room) => room.id === activeRoomId);

  const moveSelection = (direction: 'next' | 'prev') => {
    if (rooms.length === 0) return;
    if (activeIndex === -1) {
      onSelectRoom(rooms[0].id);
      return;
    }
    const offset = direction === 'next' ? 1 : -1;
    const nextIndex = (activeIndex + offset + rooms.length) % rooms.length;
    onSelectRoom(rooms[nextIndex].id);
  };

  return (
    <div className="max-h-[calc(100vh-19rem)] overflow-y-auto pr-1 [scrollbar-width:thin]">
      <div className="border-l border-border/70 pl-3" role="listbox" aria-label="Räume">
        <div className="space-y-1.5">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectRoom(room.id)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  moveSelection('next');
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  moveSelection('prev');
                }
              }}
              role="option"
              aria-label={`Raum ${room.name}`}
              aria-selected={room.id === activeRoomId}
              className={cn(
                'group w-full rounded-md px-2.5 py-2 text-left transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
                room.id === activeRoomId
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/45 hover:text-foreground',
              )}
            >
              <p className="flex items-center gap-1.5 text-[11px]">
                <Home className="h-3.5 w-3.5 shrink-0" />
                {room.building} · {room.level}
              </p>
              <p className="mt-1 text-[13px] font-medium text-foreground">{room.name}</p>
              <p className="text-[11px] text-muted-foreground">{room.areaM2 ? `${room.areaM2.toFixed(1)} m²` : 'Ohne Flächenangabe'}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
