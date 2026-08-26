import { Eye, Pencil, Trash2 } from 'lucide-react';
import { TableActionButton } from '@/components/shared/table-action-button';
import { StatusDot } from '@/components/shared/status-dot';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils';
import type { GatewayDTO } from '@/feat/gateway/dto';

export interface GatewayColumnHandlers {
  onToggleSelect: (id: string) => void;
  isSelected: (id: string) => boolean;
  onView: (gateway: GatewayDTO) => void;
  onEdit: (gateway: GatewayDTO) => void;
  onDelete: (gateway: GatewayDTO) => void;
}

/** Column config for the Gateway list table (Figma node 25:25477). */
export function getGatewayColumns({
  onToggleSelect,
  isSelected,
  onView,
  onEdit,
  onDelete,
}: GatewayColumnHandlers) {
  return {
    checkbox: (gateway: GatewayDTO) => (
      <Checkbox
        checked={isSelected(gateway.id)}
        onCheckedChange={() => onToggleSelect(gateway.id)}
      />
    ),
    gateway: (gateway: GatewayDTO) => (
      <div className="flex flex-col gap-0.5 py-1">
        <span>{gateway.name}</span>
        <span className="text-[10px] text-slate-500">{gateway.eui}</span>
      </div>
    ),
    modelUnit: (gateway: GatewayDTO) => (
      <span className="text-slate-500">{gateway.modelUnit || '-'}</span>
    ),
    simcard: (gateway: GatewayDTO) => (
      <span className="text-slate-500">{gateway.simcard || '-'}</span>
    ),
    installation: (gateway: GatewayDTO) => (
      <span className="text-slate-500">
        {gateway.installationDate ? formatDate(gateway.installationDate) : '-'}
      </span>
    ),
    source: (gateway: GatewayDTO) => (
      <span className="text-slate-500">{gateway.powerSource || '-'}</span>
    ),
    status: (gateway: GatewayDTO) => (
      <StatusDot
        label={gateway.status === 'online' ? 'Online' : 'Offline'}
        tone={gateway.status === 'online' ? 'success' : 'error'}
      />
    ),
    action: (gateway: GatewayDTO) => (
      <div className="flex items-center gap-2">
        <TableActionButton
          icon={Eye}
          aria-label={`View ${gateway.name}`}
          onClick={() => onView(gateway)}
        />
        <TableActionButton
          icon={Pencil}
          aria-label={`Edit ${gateway.name}`}
          onClick={() => onEdit(gateway)}
        />
        <TableActionButton
          icon={Trash2}
          tone="destructive"
          aria-label={`Delete ${gateway.name}`}
          onClick={() => onDelete(gateway)}
        />
      </div>
    ),
  };
}
