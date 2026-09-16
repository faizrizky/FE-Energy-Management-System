import { Eye, Pencil, Trash2 } from 'lucide-react';
import { StatusDot } from '@/components/shared/status-dot';
import { TableActionButton } from '@/components/shared/table-action-button';
import { DevicePowerControl } from '@/components/shared/device-power-control';
import { Checkbox } from '@/components/ui/checkbox';
import { formatKwh } from '@/lib/utils';
import type { RoomListItemDTO } from '@/feat/rooms/dto';

export interface RoomsColumnHandlers {
  onToggleSelect: (id: string) => void;
  isSelected: (id: string) => boolean;
  onTogglePower: (room: RoomListItemDTO) => void;
  onView: (room: RoomListItemDTO) => void;
  onEdit: (room: RoomListItemDTO) => void;
  onDelete: (room: RoomListItemDTO) => void;
}

/**
 * Renderer tiap kolom tabel room: checkbox, nama/lokasi, gateway, device
 * online/offline, usage 24 jam, switch power room + jumlah pending, tombol
 * aksi.
 *
 * Dipake di: app/(protected)/rooms/client.tsx.
 */
export function getRoomsColumns({
  onToggleSelect,
  isSelected,
  onTogglePower,
  onView,
  onEdit,
  onDelete,
}: RoomsColumnHandlers) {
  return {
    checkbox: (room: RoomListItemDTO) => (
      <Checkbox
        checked={isSelected(room.id)}
        onCheckedChange={() => onToggleSelect(room.id)}
      />
    ),
    room: (room: RoomListItemDTO) => (
      <div className="flex flex-col gap-0.5 py-1">
        <span>{room.name}</span>
        <span className="text-[10px] text-slate-500">{room.location}</span>
      </div>
    ),
    gateway: (room: RoomListItemDTO) => (
      <span className="text-slate-500">{room.gatewayId}</span>
    ),
    device: (room: RoomListItemDTO) => (
      <div className="flex items-center gap-2">
        {room.devicesOnline > 0 && (
          <StatusDot label={room.devicesOnline} tone="success" />
        )}
        {room.devicesOffline > 0 && (
          <StatusDot label={room.devicesOffline} tone="error" />
        )}
      </div>
    ),
    usage: (room: RoomListItemDTO) => (
      <span className="text-slate-500">
        {formatKwh(room.totalUsage24hKwh, 0)}
      </span>
    ),
    status: (room: RoomListItemDTO) => (
      <DevicePowerControl
        checked={
          room.pendingAction ? room.pendingAction === 'on' : room.isPowerOn
        }
        pending={(room.pendingCommandCount ?? 0) > 0}
        pendingLabel={`${room.pendingCommandCount} pending`}
        uncertain={room.statusUncertain}
        resync={room.pendingResync ?? room.statusResync}
        offline={room.devicesOnline === 0}
        onlineUntil={room.onlineUntil}
        onToggle={() => onTogglePower(room)}
      />
    ),
    action: (room: RoomListItemDTO) => (
      <div className="flex items-center gap-2">
        <TableActionButton
          icon={Eye}
          aria-label={`View ${room.name}`}
          onClick={() => onView(room)}
        />
        <TableActionButton
          icon={Pencil}
          aria-label={`Edit ${room.name}`}
          onClick={() => onEdit(room)}
        />
        <TableActionButton
          icon={Trash2}
          tone="destructive"
          aria-label={`Delete ${room.name}`}
          onClick={() => onDelete(room)}
        />
      </div>
    ),
  };
}
