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
        <span>{user.fullName}</span>
        <span className="text-[10px] text-slate-500">@{user.username}</span>
      </div>
    ),
    email: (user: UserDTO) => (
      <span className="text-slate-500">{user.email}</span>
    ),
    role: (user: UserDTO) => (
      <span className="text-slate-500">{user.role?.name ?? '-'}</span>
    ),
    phone: (user: UserDTO) => (
      <span className="text-slate-500">{user.phone || '-'}</span>
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
