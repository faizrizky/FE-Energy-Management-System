import { Eye, Pencil, Trash2 } from 'lucide-react';
import { TableActionButton } from '@/components/shared/table-action-button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils';
import type { UserDTO } from '@/feat/user/dto';

export interface UserColumnHandlers {
  onToggleSelect: (id: string) => void;
  isSelected: (id: string) => boolean;
  onView: (user: UserDTO) => void;
  onEdit: (user: UserDTO) => void;
  onDelete: (user: UserDTO) => void;
}

function roleBadgeClass(roleName?: string) {
  const key = (roleName ?? '').toLowerCase();
  if (key.includes('admin')) return 'bg-emerald-100 text-emerald-700';
  if (key.includes('pic')) return 'bg-sky-100 text-sky-700';
  return 'bg-blue-100 text-blue-700';
}

export function getUserColumns({
  onToggleSelect,
  isSelected,
  onView,
  onEdit,
  onDelete,
}: UserColumnHandlers) {
  return {
    checkbox: (user: UserDTO) => (
      <Checkbox
        checked={isSelected(user.id)}
        onCheckedChange={() => onToggleSelect(user.id)}
      />
    ),

    user: (user: UserDTO) => (
      <div className="flex flex-col gap-0.5 py-1">
        <span className="font-medium text-slate-950">{user.fullName}</span>
        <span className="text-[10px] text-slate-500">{user.phone || '-'}</span>
        <span className="text-[10px] text-slate-500">{user.email}</span>
      </div>
    ),
    address: (user: UserDTO) => (
      <span className="text-slate-500">{user.address || '-'}</span>
    ),
    role: (user: UserDTO) => (
      <span
        className={`inline-flex items-center rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClass(
          user.role?.name
        )}`}
      >
        {user.role?.name ?? '-'}
      </span>
    ),
    lastActive: (user: UserDTO) => (
      <span className="text-slate-500">
        {user.lastActiveAt ? formatDate(user.lastActiveAt) : 'Never'}
      </span>
    ),
    action: (user: UserDTO) => (
      <div className="flex items-center gap-2">
        <TableActionButton
          icon={Eye}
          aria-label={`View ${user.fullName}`}
          onClick={() => onView(user)}
        />
        <TableActionButton
          icon={Pencil}
          aria-label={`Edit ${user.fullName}`}
          onClick={() => onEdit(user)}
        />
        <TableActionButton
          icon={Trash2}
          tone="destructive"
          aria-label={`Delete ${user.fullName}`}
          onClick={() => onDelete(user)}
        />
      </div>
    ),
  };
}
