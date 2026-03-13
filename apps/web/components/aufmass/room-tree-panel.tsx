import { Home } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import type { AufmassRoom } from '@/lib/aufmass/types';

type RoomTreePanelProps = {
  rooms: AufmassRoom[];
  activeRoomId?: string;
  onSelectRoom: (roomId: string) => void;
};

export function RoomTreePanel({ rooms, activeRoomId, onSelectRoom }: RoomTreePanelProps) {
  const activeIndex = rooms.findIndex((room) => room.id === activeRoomId);
  const roomRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

  useEffect(() => {
    if (!activeRoomId) return;
    roomRefs.current[activeRoomId]?.focus();
  }, [activeRoomId]);

  return (
    <div
      className="max-h-[calc(100vh-20rem)] sm:max-h-[calc(100vh-19rem)] space-y-2 sm:space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]"
      role="listbox"
      aria-label="Räume"
    >
      {rooms.map((room) => (
        <button
          key={room.id}
          id={`aufmass-room-option-${room.id}`}
          type="button"
          onClick={() => onSelectRoom(room.id)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              moveSelection('next');
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              moveSelection('prev');
            } else if (event.key === 'Home') {
              event.preventDefault();
              onSelectRoom(rooms[0].id);
            } else if (event.key === 'End') {
              event.preventDefault();
              onSelectRoom(rooms[rooms.length - 1].id);
            }
          }}
          role="option"
          aria-label={`Raum ${room.name}`}
          aria-selected={room.id === activeRoomId}
          tabIndex={room.id === activeRoomId ? 0 : -1}
          ref={(node) => {
            roomRefs.current[room.id] = node;
          }}
          className={cn(
            'group w-full rounded-lg border px-3 py-2 text-left transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 touch-manipulation motion-reduce:transition-none',
            room.id === activeRoomId
              ? 'border-primary/40 bg-muted/65 shadow-[0_0_0_1px_rgba(255,255,255,0.7)_inset]'
              : 'border-border/80 bg-sidebar/20 hover:-translate-y-px hover:border-border hover:bg-sidebar/45',
          )}
        >
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors duration-150 group-hover:text-foreground/80">
            <Home className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{room.building} · {room.level}</span>
          </p>
          <p className="text-sm font-medium truncate" title={room.name}>{room.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {room.areaM2 ? `${room.areaM2.toFixed(1)} m²` : 'Ohne Flächenangabe'}
          </p>
        </button>
      ))}
    </div>
  );
}
