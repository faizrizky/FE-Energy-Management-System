'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  gatewayFormSchema,
  type GatewayFormValues,
} from '@/feat/gateway/schema';

interface GatewayFormProps {
  defaultValues?: Partial<GatewayFormValues>;
  onSubmit: (values: GatewayFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function GatewayForm({
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
      description: '',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Gateway name" error={errors.name?.message}>
        <Input
          placeholder="e.g. Gateway Lantai 1"
          {...register('name')}
          aria-invalid={!!errors.name}
        />
      </Field>

      <Field label="Gateway EUI" error={errors.eui?.message}>
        <Input
          placeholder="e.g. GW-EUI-0001"
          {...register('eui')}
          aria-invalid={!!errors.eui}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Simcard" error={errors.simcard?.message}>
          <Input
            placeholder="e.g. 08123456789"
            {...register('simcard')}
            aria-invalid={!!errors.simcard}
          />
        </Field>

        <Field
          label="Installation date"
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
        <Field label="Power source" error={errors.powerSource?.message}>
          <Input
            placeholder="e.g. PLN / Solar"
            {...register('powerSource')}
            aria-invalid={!!errors.powerSource}
          />
        </Field>

        <Field label="Model unit" error={errors.modelUnit?.message}>
          <Input
            placeholder="e.g. Kerlink Wirnet"
            {...register('modelUnit')}
            aria-invalid={!!errors.modelUnit}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          {...register('description')}
          rows={3}
          className="w-full rounded-md border border-slate-400 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          placeholder="Notes about this gateway"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
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
