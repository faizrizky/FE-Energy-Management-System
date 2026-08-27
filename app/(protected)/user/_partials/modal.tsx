'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { UserForm } from './form';
import { usersClientApi } from '@/feat/user/api.client';
import type { UserFormValues } from '@/feat/user/schema';
import type { UserDTO } from '@/feat/user/dto';
import type { RoleDTO } from '@/feat/role/dto';

interface UserFormModalProps {
  open: boolean;
  user?: UserDTO;
  roles: RoleDTO[];
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: UserDTO) => void;
}

export function UserFormModal({
  open,
  user,
  roles,
  onOpenChange,
  onSuccess,
}: UserFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const defaultValues: Partial<UserFormValues> = user
    ? {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone ?? '',
        address: user.address ?? '',
        roleId: user.roleId,
        password: '',
      }
    : {
        fullName: '',
        username: '',
        email: '',
        phone: '',
        address: '',
        roleId: '',
        password: '',
      };

  const handleSubmit = async (values: UserFormValues) => {
    setSubmitting(true);
    try {
      const saved = user
        ? await usersClientApi.update(user.id, values)
        : await usersClientApi.create(values);
      onSuccess(saved);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.5)] p-4 backdrop-blur-[10px]">
      <div className="flex max-h-[90vh] w-full max-w-[550px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0px_8px_12px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-emerald-500">
            {user ? 'Edit user' : 'Add user'}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="rounded-md p-1 hover:bg-slate-100"
          >
            <X className="size-5 text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          <UserForm
            roles={roles}
            isEdit={!!user}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  );
}
