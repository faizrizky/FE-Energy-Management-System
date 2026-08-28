'use client';

import { X } from 'lucide-react';
import { UserForm } from './form';
import type { UserDTO } from '@/feat/user/dto';
import type { RoleDTO } from '@/feat/role/dto';

interface UserDetailModalProps {
  user: UserDTO | null;
  roles: RoleDTO[];
  onClose: () => void;
}

export function UserDetailModal({
  user,
  roles,
  onClose,
}: UserDetailModalProps) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.5)] p-4 backdrop-blur-[10px]">
      <div className="flex max-h-[90vh] w-full max-w-[550px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0px_8px_12px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-emerald-500">
            Detail user
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-slate-100"
          >
            <X className="size-5 text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          <UserForm
            roles={roles}
            isEdit
            readOnly
            defaultValues={{
              fullName: user.fullName,
              username: user.username,
              email: user.email,
              phone: user.phone ?? '',
              address: user.address ?? '',
              roleId: user.roleId,
              password: '',
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
