'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { roomFormSchema, type RoomFormValues } from '@/feat/rooms/schema';
import type { UserSummaryDTO } from '@/feat/user/dto';

interface RoomFormProps {
  users: UserSummaryDTO[];
  isEdit: boolean;
  defaultValues?: Partial<RoomFormValues>;
  onSubmit: (values: RoomFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

/** Add / Edit room form — validated with the shared `roomFormSchema`. */
export function RoomForm({
  users,
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
}: RoomFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: '',
      picName: '',
      picPhone: '',
      location: '',
      description: '',
      isCritical: false,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Room name" required error={errors.name?.message}>
          <Input
            placeholder="Type room name here ..."
            {...register('name')}
            aria-invalid={!!errors.name}
          />
        </Field>

        <Field label="PIC contact" required error={errors.picPhone?.message}>
          <Input
            placeholder="Type building pic contact here ..."
            {...register('picPhone')}
            aria-invalid={!!errors.picPhone}
          />
        </Field>
      </div>

      <Field
        label="Choose building PIC"
        required
        error={errors.picName?.message}
      >
        <SelectField>
          <select
            {...register('picName')}
            className="h-8 w-full appearance-none rounded-md border border-slate-400 bg-white px-3 pr-8 text-sm text-slate-950 outline-none"
          >
            <option value="">Choose building PIC ...</option>
            {users.map((user) => (
              <option key={user.id} value={user.fullName}>
                {user.fullName}
              </option>
            ))}
          </select>
        </SelectField>
      </Field>

      <Field label="Room location" required error={errors.location?.message}>
        <textarea
          {...register('location')}
          rows={3}
          placeholder="Type your room location here ..."
          className="w-full rounded-md border border-slate-400 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        />
      </Field>

      <Field
        label="Room description"
        hint="Optional field"
        error={errors.description?.message}
      >
        <textarea
          {...register('description')}
          rows={3}
          className="w-full rounded-md border border-slate-400 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          placeholder="Type your room description here ..."
        />
      </Field>

      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Gateway, reporting interval, and device assignment are configured
        per-device from the{' '}
        <span className="font-medium text-slate-700">Device</span> page after
        this room is created.
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-950">
        <Checkbox {...register('isCritical')} />
        Mark as critical room
      </label>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {!isEdit && <Plus className="size-4" />}
          {submitting ? 'Saving...' : isEdit ? 'Save room' : 'Add room'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
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
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}
