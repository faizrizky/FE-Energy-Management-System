'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  gatewayFormSchema,
  type GatewayFormValues,
} from '@/feat/gateway/schema';
import type { UserSummaryDTO } from '@/feat/user/dto';

interface GatewayFormProps {
  users: UserSummaryDTO[];
  defaultValues?: Partial<GatewayFormValues>;
  onSubmit: (values: GatewayFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function GatewayForm({
  users,
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
}: GatewayFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GatewayFormValues>({
    resolver: zodResolver(gatewayFormSchema),
    defaultValues: {
      name: '',
      eui: '',
      simcard: '',
      installationDate: '',
      powerSource: '',
      modelUnit: '',
      installedById: '',
      description: '',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Gateway name" required error={errors.name?.message}>
          <Input
            placeholder="Type gateway name here..."
            {...register('name')}
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field label="Gateway EUI" required error={errors.eui?.message}>
          <Input
            placeholder="Type gateway EUI here..."
            {...register('eui')}
            aria-invalid={!!errors.eui}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Simcard" required error={errors.simcard?.message}>
          <Input
            placeholder="Type simcard number here..."
            {...register('simcard')}
            aria-invalid={!!errors.simcard}
          />
        </Field>
        <Field
          label="Installation date"
          required
          error={errors.installationDate?.message}
        >
          <Input
            type="date"
            {...register('installationDate')}
            aria-invalid={!!errors.installationDate}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Power source"
          required
          error={errors.powerSource?.message}
        >
          <Input
            placeholder="e.g. PLN, Genset, Solar"
            {...register('powerSource')}
            aria-invalid={!!errors.powerSource}
          />
        </Field>
        <Field label="Model unit" required error={errors.modelUnit?.message}>
          <Input
            placeholder="Type model unit here..."
            {...register('modelUnit')}
            aria-invalid={!!errors.modelUnit}
          />
        </Field>
      </div>

      <Field
        label="Installed by"
        required
        error={errors.installedById?.message}
      >
        <SelectField>
          <select
            {...register('installedById')}
            aria-invalid={!!errors.installedById}
            className="h-11 w-full appearance-none rounded-lg border border-slate-400 bg-white px-3 pr-10 text-sm text-slate-950 outline-none shadow-[0_1px_2px_rgba(0,0,0,0.1)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 aria-[invalid=true]:border-status-error"
          >
            <option value="">Choose installation by which user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName} (@{user.username})
              </option>
            ))}
          </select>
        </SelectField>
      </Field>

      <Field
        label="Gateway description"
        hint="Optional field"
        error={errors.description?.message}
      >
        <textarea
          {...register('description')}
          rows={3}
          className="w-full rounded-md border border-slate-400 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          placeholder="Type gateway description here..."
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save gateway'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-950">
          {label} {required && <span className="text-status-error">*</span>}
        </label>
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
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-700" />
    </div>
  );
}
