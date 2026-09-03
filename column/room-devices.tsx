import { FileClock, Trash2 } from 'lucide-react';
import { TableActionButton } from '@/components/shared/table-action-button';
import { Switch } from '@/components/ui/switch';
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

/** Column config for the "Rooms - device list" table (Figma node 18:9068). */
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
      <div className="flex flex-col gap-0.5 py-1">
        <span>{device.tbDeviceId}</span>
        <span className="text-[10px] text-slate-500">{device.deviceEui}</span>
      </div>
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
      const isBelowMinimum = device.intervalMinutes < 15;
      return (
        <div className="flex flex-col gap-0.5">
          <input
            type="number"
            min={15}
            defaultValue={device.intervalMinutes}
            onBlur={(e) => onIntervalChange(device, Number(e.target.value))}
            aria-invalid={isBelowMinimum}
            className="h-6 w-[100px] rounded-md border border-slate-400 px-2 text-sm aria-[invalid=true]:border-status-error"
          />
          {isBelowMinimum && (
            <span className="text-[10px] text-status-error">
              Min 15 minutes
            </span>
          )}
        </div>
      );
    },
    status: (device: RoomDeviceDTO) => (
      <Switch
        checked={device.isPowerOn}
        onCheckedChange={() => onTogglePower(device)}
      />
    ),
    action: (device: RoomDeviceDTO) => (
      <div className="flex items-center gap-2">
        <TableActionButton
          icon={FileClock}
          aria-label={`View log for ${device.tbDeviceId}`}
          onClick={() => onViewLog(device)}
        />
        <TableActionButton
          icon={Trash2}
          tone="destructive"
          aria-label={`Delete ${device.tbDeviceId}`}
          onClick={() => onDelete(device)}
        />
      </div>
    ),
  };
}
