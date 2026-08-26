import { Pencil, Trash2 } from 'lucide-react';
import { TableActionButton } from '@/components/shared/table-action-button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import type { DeviceDTO } from '@/feat/device/dto';

export interface DeviceColumnHandlers {
  onToggleSelect: (id: string) => void;
  isSelected: (id: string) => boolean;
  onTogglePower: (device: DeviceDTO) => void;
  onEdit: (device: DeviceDTO) => void;
  onDelete: (device: DeviceDTO) => void;
}

export function getDeviceColumns({
  onToggleSelect,
  isSelected,
  onTogglePower,
  onEdit,
  onDelete,
}: DeviceColumnHandlers) {
  return {
    checkbox: (device: DeviceDTO) => (
      <Checkbox
        checked={isSelected(device.id)}
        onCheckedChange={() => onToggleSelect(device.id)}
      />
    ),
    device: (device: DeviceDTO) => (
      <div className="flex flex-col gap-0.5 py-1">
        <span>{device.name}</span>
        <span className="text-[10px] text-slate-500">{device.eui}</span>
      </div>
    ),
    component: (device: DeviceDTO) => (
      <span className="text-slate-500">{device.deviceType || '-'}</span>
    ),
    room: (device: DeviceDTO) => (
      <span className="text-slate-500">{device.room?.name ?? '-'}</span>
    ),
    gateway: (device: DeviceDTO) => (
      <span className="text-slate-500">{device.gateway?.name ?? '-'}</span>
    ),
    tbDeviceId: (device: DeviceDTO) => (
      <span
        className={device.tbDeviceId ? 'text-slate-500' : 'text-status-error'}
      >
        {device.tbDeviceId || 'Not mapped'}
      </span>
    ),
    interval: (device: DeviceDTO) => (
      <span className="text-slate-500">{device.intervalMinutes} min</span>
    ),
    status: (device: DeviceDTO) => (
      <Switch
        checked={device.status === 'on'}
        onCheckedChange={() => onTogglePower(device)}
      />
    ),
    action: (device: DeviceDTO) => (
      <div className="flex items-center gap-2">
        <TableActionButton
          icon={Pencil}
          aria-label={`Edit ${device.name}`}
          onClick={() => onEdit(device)}
        />
        <TableActionButton
          icon={Trash2}
          tone="destructive"
          aria-label={`Delete ${device.name}`}
          onClick={() => onDelete(device)}
        />
      </div>
    ),
  };
}
