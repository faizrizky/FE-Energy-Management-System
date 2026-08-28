import { Eye, Pencil, Trash2 } from 'lucide-react';
import { TableActionButton } from '@/components/shared/table-action-button';
import { Checkbox } from '@/components/ui/checkbox';
import type { RoleDTO } from '@/feat/role/dto';

export interface RoleColumnHandlers {
  onToggleSelect: (id: string) => void;
  isSelected: (id: string) => boolean;
  onView: (role: RoleDTO) => void;
  onEdit: (role: RoleDTO) => void;
  onDelete: (role: RoleDTO) => void;
}

export function getRoleColumns({
  onToggleSelect,
  isSelected,
  onView,
  onEdit,
  onDelete,
}: RoleColumnHandlers) {
  return {
    checkbox: (role: RoleDTO) => (
      <Checkbox
        checked={isSelected(role.id)}
        onCheckedChange={() => onToggleSelect(role.id)}
      />
    ),
    role: (role: RoleDTO) => (
      <span className="font-medium text-slate-950">{role.name}</span>
    ),
    users: (role: RoleDTO) => (
      <span className="text-slate-500">{role._count?.users ?? 0}</span>
    ),
    permissionCount: (role: RoleDTO) => (
      <span className="text-slate-500">{role.permissions?.length ?? 0}</span>
    ),
    action: (role: RoleDTO) => (
      <div className="flex items-center gap-2">
        <TableActionButton
          icon={Eye}
          aria-label={`View ${role.name}`}
          onClick={() => onView(role)}
        />
        <TableActionButton
          icon={Pencil}
          aria-label={`Edit ${role.name}`}
          disabled={role.isSystem}
          onClick={() => onEdit(role)}
        />
        <TableActionButton
          icon={Trash2}
          tone="destructive"
          disabled={role.isSystem}
          aria-label={
            role.isSystem
              ? `${role.name} is a system role and cannot be deleted`
              : `Delete ${role.name}`
          }
          onClick={() => onDelete(role)}
        />
      </div>
    ),
  };
}
