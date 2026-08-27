'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { RoleForm } from './form';
import { rolesClientApi } from '@/feat/role/api.client';
import type { RoleFormValues } from '@/feat/role/schema';
import type { RoleDTO, PermissionDTO } from '@/feat/role/dto';

interface RoleFormModalProps {
  open: boolean;
  role?: RoleDTO;
  permissions: PermissionDTO[];
  onOpenChange: (open: boolean) => void;
  onSuccess: (role: RoleDTO) => void;
}

export function RoleFormModal({
  open,
  role,
  permissions,
  onOpenChange,
  onSuccess,
}: RoleFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const defaultValues: Partial<RoleFormValues> = role
    ? {
        name: role.name,
        description: role.description ?? '',
        permissionIds: role.permissions?.map((rp) => rp.permission.id) ?? [],
      }
    : {
        name: '',
        description: '',
        permissionIds: [],
      };

  const handleSubmit = async (values: RoleFormValues) => {
    setSubmitting(true);
    try {
      const saved = role
        ? await rolesClientApi.update(role.id, values)
        : await rolesClientApi.create(values);
      onSuccess(saved);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.5)] p-4 backdrop-blur-[10px]">
      <div className="flex max-h-[90vh] w-full max-w-[600px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0px_8px_12px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-emerald-500">
            {role ? 'Edit role' : 'Add role'}
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
          <RoleForm
            permissions={permissions}
            isSystem={role?.isSystem}
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
