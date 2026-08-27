'use client';

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { roleFormSchema, type RoleFormValues } from '@/feat/role/schema';
import type { PermissionDTO } from '@/feat/role/dto';

interface RoleFormProps {
  permissions: PermissionDTO[];
  isSystem?: boolean;
  defaultValues?: Partial<RoleFormValues>;
  onSubmit: (values: RoleFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function RoleForm({
  permissions,
  isSystem,
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
}: RoleFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      permissionIds: [],
      ...defaultValues,
    },
  });

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, PermissionDTO[]>();
    for (const permission of permissions) {
      const list = groups.get(permission.module) ?? [];
      list.push(permission);
      groups.set(permission.module, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Role name" error={errors.name?.message}>
        <Input
          placeholder="e.g. Building Supervisor"
          {...register('name')}
          aria-invalid={!!errors.name}
          disabled={isSystem}
        />
      </Field>

      <Field label="Description" error={errors.description?.message}>
        <textarea
          {...register('description')}
          rows={2}
          disabled={isSystem}
          className="w-full rounded-md border border-slate-400 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:bg-slate-50"
          placeholder="What can this role do?"
        />
      </Field>

      {isSystem && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          This is a system role. Name and description are locked, but you can
          still adjust its permissions.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-950">
          Permissions
        </label>
        {errors.permissionIds?.message && (
          <span className="text-xs text-status-error">
            {errors.permissionIds.message}
          </span>
        )}

        <Controller
          name="permissionIds"
          control={control}
          render={({ field }) => (
            <div className="flex max-h-[320px] flex-col gap-3 overflow-y-auto rounded-xl border border-slate-300 p-4">
              {groupedPermissions.map(([module, modulePermissions]) => {
                const moduleIds = modulePermissions.map((p) => p.id);
                const allChecked = moduleIds.every((id) =>
                  field.value.includes(id)
                );

                const toggleModule = () => {
                  if (allChecked) {
                    field.onChange(
                      field.value.filter(
                        (id: string) => !moduleIds.includes(id)
                      )
                    );
                  } else {
                    field.onChange(
                      Array.from(new Set([...field.value, ...moduleIds]))
                    );
                  }
                };

                const togglePermission = (id: string) => {
                  field.onChange(
                    field.value.includes(id)
                      ? field.value.filter((v: string) => v !== id)
                      : [...field.value, id]
                  );
                };

                return (
                  <div key={module} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={toggleModule}
                      />
                      <span className="text-sm font-semibold capitalize text-emerald-700">
                        {module}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-1">
                      {modulePermissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <Checkbox
                            checked={field.value.includes(permission.id)}
                            onCheckedChange={() =>
                              togglePermission(permission.id)
                            }
                          />
                          <span className="capitalize">
                            {permission.action.replace(/_/g, ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save role'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-950">{label}</label>
      {children}
      {error && <span className="text-xs text-status-error">{error}</span>}
    </div>
  );
}
