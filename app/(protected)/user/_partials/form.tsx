'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { userFormSchema, type UserFormValues } from '@/feat/user/schema';
import type { RoleDTO } from '@/feat/role/dto';

interface UserFormProps {
  roles: RoleDTO[];
  isEdit: boolean;
  defaultValues?: Partial<UserFormValues>;
  onSubmit: (values: UserFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function UserForm({
  roles,
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      address: '',
      roleId: '',
      password: '', // NEVER prefilled with real value, even in edit mode
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full name" error={errors.fullName?.message}>
          <Input
            placeholder="e.g. Budi Santoso"
            {...register('fullName')}
            aria-invalid={!!errors.fullName}
          />
        </Field>

        <Field label="Username" error={errors.username?.message}>
          <Input
            placeholder="e.g. budi.santoso"
            {...register('username')}
            aria-invalid={!!errors.username}
          />
        </Field>
      </div>

      <Field label="Email" error={errors.email?.message}>
        <Input
          type="email"
          placeholder="e.g. budi@falahtech.co.id"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone" error={errors.phone?.message}>
          <Input placeholder="e.g. 0812xxxxxxx" {...register('phone')} />
        </Field>

        <Field label="Role" error={errors.roleId?.message}>
          <select
            {...register('roleId')}
            className="h-8 w-full rounded-md border border-slate-400 bg-white px-3 text-sm text-slate-950 outline-none"
          >
            <option value="">Choose role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Address" error={errors.address?.message}>
        <Input placeholder="e.g. Jl. Merdeka No. 1" {...register('address')} />
      </Field>

      <Field
        label="Password"
        error={errors.password?.message}
        hint={
          isEdit
            ? 'Leave blank to keep the current password.'
            : 'Leave blank to use the default password (must be changed later).'
        }
      >
        <Input
          type="password"
          placeholder="••••••••"
          {...register('password')}
          aria-invalid={!!errors.password}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save user'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-950">{label}</label>
      {children}
      {error ? (
        <span className="text-xs text-status-error">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-400">{hint}</span>
      ) : null}
    </div>
  );
}
