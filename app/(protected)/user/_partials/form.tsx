'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { userFormSchema, type UserFormValues } from '@/feat/user/schema';
import type { RoleDTO } from '@/feat/role/dto';

interface UserFormProps {
  roles: RoleDTO[];
  isEdit: boolean;
  defaultValues?: Partial<UserFormValues>;
  onSubmit?: (values: UserFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  readOnly?: boolean;
}

export function UserForm({
  roles,
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  readOnly,
}: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
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
      password: '',
      ...defaultValues,
    },
  });

  const submit = onSubmit
    ? handleSubmit(onSubmit)
    : (e: React.FormEvent) => e.preventDefault();

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Fullname" error={errors.fullName?.message}>
          <Input
            placeholder="Type your fullname here ..."
            disabled={readOnly}
            {...register('fullName')}
            aria-invalid={!!errors.fullName}
          />
        </Field>
        <Field label="Username" error={errors.username?.message}>
          <Input
            placeholder="Type your username here ..."
            disabled={readOnly}
            {...register('username')}
            aria-invalid={!!errors.username}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            placeholder="Type your email here ..."
            disabled={readOnly}
            {...register('email')}
            aria-invalid={!!errors.email}
          />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <Input
            placeholder="Type your phone number here ..."
            disabled={readOnly}
            {...register('phone')}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Choose role" error={errors.roleId?.message}>
          <SelectField>
            <select
              {...register('roleId')}
              disabled={readOnly}
              className="h-8 w-full appearance-none rounded-md border border-slate-400 bg-white px-3 pr-8 text-sm text-slate-950 outline-none disabled:bg-slate-50"
            >
              <option value="">Choose role to assign to this user ...</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </SelectField>
        </Field>
        <Field
          label="Password"
          error={errors.password?.message}
          hint={
            isEdit
              ? 'Leave blank to keep the current password.'
              : 'Leave blank to use the default password.'
          }
        >
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Type your password here ..."
              disabled={readOnly}
              {...register('password')}
              aria-invalid={!!errors.password}
              className="pr-9"
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            )}
          </div>
        </Field>
      </div>

      <Field
        label="Address"
        hint="Optional field"
        error={errors.address?.message}
      >
        <textarea
          placeholder="Type your address here ..."
          disabled={readOnly}
          rows={3}
          {...register('address')}
          className="w-full rounded-md border border-slate-400 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:bg-slate-50"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && (
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save user'}
          </Button>
        )}
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
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-950">{label}</label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
      {error && <span className="text-xs text-status-error">{error}</span>}
    </div>
  );
}

function SelectField({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full">
      {children}
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}
