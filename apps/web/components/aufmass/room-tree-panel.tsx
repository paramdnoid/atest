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
    <div
      className="max-h-[calc(100vh-20rem)] sm:max-h-[calc(100vh-19rem)] space-y-2 sm:space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]"
      role="listbox"
      aria-label="Räume"
    >
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
            'group w-full rounded-lg border px-3 sm:px-2.5 py-2 sm:py-1.5 text-left transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 touch-manipulation',
            room.id === activeRoomId
              ? 'border-border/80 bg-muted/60 shadow-[0_0_0_1px_rgba(255,255,255,0.7)_inset]'
              : 'border-border/80 bg-sidebar/20 hover:-translate-y-px hover:border-border hover:bg-sidebar/45',
          )}
        >
          <p className="flex items-center gap-1.5 text-xs sm:text-[11px] text-muted-foreground transition-colors duration-150 group-hover:text-foreground/80">
            <Home className="h-3.5 w-3.5 sm:h-3 sm:w-3 shrink-0" />
            <span className="truncate">{room.building} · {room.level}</span>
          </p>
          <p className="text-sm sm:text-[13px] font-medium truncate" title={room.name}>{room.name}</p>
          <p className="text-xs sm:text-[11px] text-muted-foreground">
            {room.areaM2 ? `${room.areaM2.toFixed(1)} m²` : 'Ohne Flächenangabe'}
          </p>
        </button>
      ))}
    </div>
  );
}
