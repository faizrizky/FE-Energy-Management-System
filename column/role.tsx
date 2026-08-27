import { Eye, Pencil, Trash2, Lock } from 'lucide-react';
import { TableActionButton } from '@/components/shared/table-action-button';
import { Badge } from '@/components/ui/badge';
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
      <div className="flex flex-col gap-0.5 py-1">
        <span>{role.name}</span>
        {role.description && (
          <span className="text-[10px] text-slate-500">{role.description}</span>
        )}
      </div>
    ),
    permissionCount: (role: RoleDTO) => (
      <span className="text-slate-500">
        {role.permissions?.length ?? 0} permission(s)
      </span>
    ),
    type: (role: RoleDTO) =>
      role.isSystem ? (
        <Badge variant="neutral" className="gap-1">
          <Lock className="size-3" /> System
        </Badge>
      ) : (
        <Badge variant="success">Custom</Badge>
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
