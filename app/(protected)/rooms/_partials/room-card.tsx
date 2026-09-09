import { Pencil, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { formatKwh } from '@/lib/utils';
import type { RoomListItemDTO } from '@/feat/rooms/dto';

interface RoomCardProps {
  room: RoomListItemDTO;
  onTogglePower: (room: RoomListItemDTO) => void;
  onView: (room: RoomListItemDTO) => void;
  onEdit: (room: RoomListItemDTO) => void;
  onDelete: (room: RoomListItemDTO) => void;
}

export function RoomCard({
  room,
  onTogglePower,
  onView,
  onEdit,
  onDelete,
}: RoomCardProps) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onView(room)}
          className="min-w-0 text-left"
        >
          <p className="truncate text-base font-semibold text-slate-950">
            {room.name}
          </p>
          <p className="truncate text-xs text-slate-500">{room.location}</p>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label={`Edit ${room.name}`}
            onClick={() => onEdit(room)}
            className="flex size-10 items-center justify-center rounded-md border border-slate-400 bg-white text-slate-950"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${room.name}`}
            onClick={() => onDelete(room)}
            className="flex size-10 items-center justify-center rounded-md border border-status-error bg-white text-status-error"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Gateway</span>
          <span className="text-sm font-medium text-slate-950">
            {room.gatewayId ?? '-'}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-slate-500">Device</span>
          <div className="flex flex-col items-end gap-0.5 text-xs">
            {room.devicesOnline > 0 && (
              <span className="flex items-center gap-1.5 text-green-500">
                <span className="size-1.5 rounded-full bg-green-500" />
                {room.devicesOnline} online
              </span>
            )}
            {room.devicesOffline > 0 && (
              <span className="flex items-center gap-1.5 text-red-500">
                <span className="size-1.5 rounded-full bg-red-500" />
                {room.devicesOffline} offline
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Usage(24H)</span>
        <span className="text-sm font-medium text-slate-950">
          {formatKwh(room.totalUsage24hKwh, 0)}
        </span>
      </div>

      <div className="h-px bg-slate-100" />

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Device status</span>
        <Switch
          checked={room.isPowerOn}
          onCheckedChange={() => onTogglePower(room)}
        />
      </div>
    </div>
  );
}
