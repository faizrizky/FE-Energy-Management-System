import { FileClock, Trash2 } from 'lucide-react';
import { TableActionButton } from '@/components/shared/table-action-button';
import { DevicePowerControl } from '@/components/shared/device-power-control';
import { Checkbox } from '@/components/ui/checkbox';
import { formatKwh } from '@/lib/utils';
import type { RoomDeviceDTO } from '@/feat/rooms/dto';

export interface RoomDevicesColumnHandlers {
  onToggleSelect: (id: string) => void;
  isSelected: (id: string) => boolean;
  onTogglePower: (device: RoomDeviceDTO) => void;
  onViewLog: (device: RoomDeviceDTO) => void;
  onDelete: (device: RoomDeviceDTO) => void;
  onIntervalChange: (device: RoomDeviceDTO, minutes: number) => void;
}

/**
 * Renderer tiap kolom tabel device di Room detail: devEUI/EUI, tipe, usage 24
 * jam, interval, switch power + batal, tombol log & hapus.
 *
 * Dipake di: app/(protected)/rooms/detail/[roomId]/client.tsx.
 */
export function getRoomDevicesColumns({
  onToggleSelect,
  isSelected,
  onTogglePower,
  onViewLog,
  onDelete,
  onIntervalChange,
}: RoomDevicesColumnHandlers) {
  return {
    checkbox: (device: RoomDeviceDTO) => (
      <Checkbox
        checked={isSelected(device.id)}
        onCheckedChange={() => onToggleSelect(device.id)}
      />
    ),
    device: (device: RoomDeviceDTO) => (
      <span>{device.deviceEui}</span>
    ),
    component: (device: RoomDeviceDTO) => (
      <span className="text-slate-500">{device.deviceType}</span>
    ),
    usage: (device: RoomDeviceDTO) => (
      <span className="text-slate-500">
        {formatKwh(device.totalUsage24hKwh, 0)}
      </span>
    ),
    interval: (device: RoomDeviceDTO) => {
      return (
        <div className="flex flex-col gap-0.5 py-1">
          <span className="text-slate-500">
            {device.intervalMinutes} minute(s)
          </span>
        </div>
      );
    },
    status: (device: RoomDeviceDTO) => (
      <DevicePowerControl
        checked={
          device.pendingCommand
            ? device.pendingCommand.action === 'on'
            : device.isPowerOn
        }
        pending={Boolean(device.pendingCommand)}
        pendingTitle={device.pendingCommand?.notes}
        uncertain={device.statusUncertain}
        resync={device.pendingCommand?.resync ?? device.statusResync}
        offline={device.isOnline === false}
        onlineUntil={device.onlineUntil}
        onToggle={() => onTogglePower(device)}
      />
    ),
    action: (device: RoomDeviceDTO) => (
      <div className="flex items-center gap-2">
        <TableActionButton
          icon={FileClock}
          aria-label={`View log for ${device.deviceEui}`}
          onClick={() => onViewLog(device)}
        />
        <TableActionButton
          icon={Trash2}
          tone="destructive"
          aria-label={`Delete ${device.deviceEui}`}
          onClick={() => onDelete(device)}
        />
      </div>
    ),
  };
}
