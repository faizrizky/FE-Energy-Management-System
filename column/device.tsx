import { Eye, Pencil, Trash2 } from 'lucide-react';
import { TableActionButton } from '@/components/shared/table-action-button';
import { DevicePowerControl } from '@/components/shared/device-power-control';
import { Checkbox } from '@/components/ui/checkbox';
import type { DeviceDTO } from '@/feat/device/dto';

export interface DeviceColumnHandlers {
  onToggleSelect: (id: string) => void;
  isSelected: (id: string) => boolean;
  onTogglePower: (device: DeviceDTO) => void;
  onView: (device: DeviceDTO) => void;
  onEdit: (device: DeviceDTO) => void;
  onDelete: (device: DeviceDTO) => void;
}

/**
 * Renderer tiap kolom tabel device: checkbox, nama, tipe, room, gateway,
 * devEUI ChirpStack, interval, switch power, tombol aksi.
 *
 * Dipake di: app/(protected)/device/client.tsx.
 */
export function getDeviceColumns({
  onToggleSelect,
  isSelected,
  onTogglePower,
  onView,
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
      <span>{device.name}</span>
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
    devEui: (device: DeviceDTO) => (
      <span className="text-slate-500">{device.eui}</span>
    ),
    interval: (device: DeviceDTO) => (
      <span className="text-slate-500">{device.intervalMinutes} min</span>
    ),
    status: (device: DeviceDTO) => (
      <DevicePowerControl
        checked={
          device.pendingCommand
            ? device.pendingCommand.action === 'on'
            : device.status === 'on'
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
    action: (device: DeviceDTO) => (
      <div className="flex items-center gap-2">
        <TableActionButton
          icon={Eye}
          aria-label={`View ${device.name}`}
          onClick={() => onView(device)}
        />
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
