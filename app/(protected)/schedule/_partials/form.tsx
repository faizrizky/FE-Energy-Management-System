'use client';

import { ChevronDown, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import {
  scheduleFormSchema,
  type ScheduleFormValues,
} from '@/feat/schedule/schema';

import { ApiError } from '@/lib/axios';

import type { RoomListItemDTO } from '@/feat/rooms/dto';
import type { ScheduleDTO } from '@/feat/schedule/dto';

interface ScheduleFormProps {
  rooms: RoomListItemDTO[];
  defaultValues?: Partial<ScheduleFormValues>;
  schedule?: ScheduleDTO;
  onSubmit: (values: ScheduleFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

const SCHEDULE_TIMEZONE_LABEL =
  process.env.NEXT_PUBLIC_SCHEDULE_TIMEZONE_LABEL || 'WIB';

const DAYS = [
  { value: 1, letter: 'M', label: 'Monday' },
  { value: 2, letter: 'T', label: 'Tuesday' },
  { value: 3, letter: 'W', label: 'Wednesday' },
  { value: 4, letter: 'T', label: 'Thursday' },
  { value: 5, letter: 'F', label: 'Friday' },
  { value: 6, letter: 'S', label: 'Saturday' },
  { value: 0, letter: 'S', label: 'Sunday' },
];

/**
 * Form tambah/edit schedule: nama, deskripsi, room, action, jam mulai, batas
 * durasi (no end/end at), sama pola ulang mingguan. Schedule sekarang selalu
 * berlaku ke seluruh device di room, jadi gak ada pilihan device lagi.
 *
 * Dipake di: schedule/_partials/modal.tsx -> ScheduleFormModal.
 */
export function ScheduleForm({
  rooms,
  defaultValues,
  schedule,
  onSubmit,
  onCancel,
  submitting,
}: ScheduleFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      roomId: '',
      action: 'on',
      startTime: '08:00',
      durationConstraint: 'no-end',
      endTime: '',
      repeatType: 'none',
      repeatDays: [],
      ...defaultValues,
    },
  });

  const action = watch('action');
  const durationConstraint = watch('durationConstraint');
  const repeatType = watch('repeatType');
  const repeatDays = watch('repeatDays');
  const negatedAction = action === 'off' ? 'ON' : 'OFF';

  const toggleDay = (day: number) => {
    const current = repeatDays ?? [];
    if (current.includes(day)) {
      setValue(
        'repeatDays',
        current.filter((value) => value !== day),
        { shouldValidate: true }
      );
    } else {
      setValue('repeatDays', [...current, day].sort((a, b) => a - b), {
        shouldValidate: true,
      });
    }
  };

  const submit = async (values: ScheduleFormValues) => {
    clearErrors('root');
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('root', {
          type: 'conflict',
          message:
            error.message || 'This schedule conflicts with another schedule.',
        });
        return;
      }
      if (error instanceof Error) {
        setError('root', { type: 'server', message: error.message });
        return;
      }
      setError('root', { type: 'server', message: 'Failed to save schedule.' });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {errors.root?.message && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">
            {errors.root.type === 'conflict'
              ? 'Schedule conflict'
              : 'Unable to save schedule'}
          </p>
          <p className="mt-1">{errors.root.message}</p>
        </div>
      )}

      <Field label="Schedule Name" required error={errors.name?.message}>
        <Input
          type="text"
          placeholder="Enter schedule name"
          {...register('name')}
          aria-invalid={!!errors.name}
          className="h-11 rounded-lg border-slate-300 text-sm"
        />
      </Field>

      <Field
        label="Schedule description"
        error={errors.description?.message}
      >
        <textarea
          placeholder="Enter schedule description"
          rows={4}
          {...register('description')}
          aria-invalid={!!errors.description}
          className="w-full resize-none rounded-lg border border-slate-400 px-3 py-2 text-sm text-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.1)] outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </Field>

      <Field label="Choose Room" required error={errors.roomId?.message}>
        <SelectField>
          <select
            {...register('roomId')}
            className="h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Select room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </SelectField>
      </Field>

      <SectionDivider label="Scheduling Controls" />

      {/* ACTION + START TIME */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Action" required error={errors.action?.message}>
          <SelectField>
            <select
              {...register('action')}
              className="h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="on">Turn ON</option>
              <option value="off">Turn OFF</option>
            </select>
          </SelectField>
        </Field>

        <Field
          label="Start Time"
          required
          error={errors.startTime?.message}
          hint={`Time in ${SCHEDULE_TIMEZONE_LABEL}.`}
        >
          <Input
            type="time"
            {...register('startTime')}
            aria-invalid={!!errors.startTime}
            className="h-11 rounded-lg border-slate-300 text-sm"
          />
        </Field>
      </div>

      {/* DURATION CONSTRAINT */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium leading-5 text-slate-950">
          Duration Constraint
          <span className="ml-1 text-red-500">*</span>
        </label>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-6">
            <DurationOption
              active={durationConstraint === 'no-end'}
              label="No end"
              onClick={() =>
                setValue('durationConstraint', 'no-end', {
                  shouldValidate: true,
                })
              }
            />
            <DurationOption
              active={durationConstraint === 'end-at'}
              label="End at"
              onClick={() =>
                setValue('durationConstraint', 'end-at', {
                  shouldValidate: true,
                })
              }
            />
          </div>

          {durationConstraint === 'end-at' ? (
            <div>
              <Input
                type="time"
                {...register('endTime')}
                aria-invalid={!!errors.endTime}
                className="h-11 rounded-lg border-slate-300 text-sm"
              />
              {errors.endTime?.message ? (
                <span className="mt-1 block text-xs leading-[18px] text-red-500">
                  {errors.endTime.message}
                </span>
              ) : (
                <span className="mt-1 block text-xs leading-[18px] text-slate-400">
                  At end time, the room will automatically turn {negatedAction}.
                </span>
              )}
            </div>
          ) : (
            <div className="flex h-11 w-full items-center rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-400 opacity-60">
              No turn-off event scheduled
            </div>
          )}
        </div>
      </div>

      {/* REPEAT */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-950">Repeat Schedule</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={repeatType !== 'none'}
              onClick={() => {
                const next = repeatType === 'none' ? 'weekly' : 'none';
                setValue('repeatType', next, { shouldValidate: true });
                if (next === 'none') setValue('repeatDays', []);
              }}
              className={[
                'relative h-6 w-11 rounded-full transition',
                repeatType !== 'none' ? 'bg-emerald-500' : 'bg-slate-300',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition',
                  repeatType !== 'none' ? 'left-[22px]' : 'left-0.5',
                ].join(' ')}
              />
            </button>
            <span className="text-sm text-neutral-500">
              {repeatType !== 'none' ? 'Repeat on' : 'Repeat off'}
            </span>
          </div>

          {repeatType === 'weekly' ? (
            <div>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => {
                  const selected = repeatDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      title={day.label}
                      onClick={() => toggleDay(day.value)}
                      className={[
                        'flex h-8 items-center justify-center rounded-lg border text-sm font-medium transition',
                        selected
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400',
                      ].join(' ')}
                    >
                      {day.letter}
                    </button>
                  );
                })}
              </div>
              {errors.repeatDays?.message && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.repeatDays.message}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs leading-[18px] text-slate-400">
              Enable Repeat to reapply the start action on selected days. The
              device state remains until changed manually or by another
              automation.
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="h-11 w-[100px] rounded-lg border-slate-400 px-4 text-sm font-medium"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-[200px] rounded-lg bg-emerald-500 px-4 text-sm font-medium text-white hover:bg-emerald-600"
        >
          <Plus className="size-4" />
          {submitting ? 'Saving...' : schedule ? 'Save changes' : 'Add schedule'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Pembungkus input form: label, hint, sama pesan error di bawahnya.
 *
 * Dipake di: ScheduleForm (file ini).
 */
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
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium leading-5 text-slate-950">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <span className="text-xs leading-[18px] text-red-500">{error}</span>
      ) : hint ? (
        <span className="text-xs leading-[18px] text-slate-400">{hint}</span>
      ) : null}
    </div>
  );
}

/**
 * Pembungkus <select> native biar ada ikon panah di kanan.
 *
 * Dipake di: ScheduleForm (file ini).
 */
function SelectField({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full">
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-700" />
    </div>
  );
}

/**
 * Garis pemisah section dengan label di tengah (mis. "Scheduling Controls").
 *
 * Dipake di: ScheduleForm (file ini).
 */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-slate-200" />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

/**
 * Radio pseudo-button buat pilihan Duration Constraint (No end / End at).
 *
 * Dipake di: ScheduleForm (file ini).
 */
function DurationOption({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2">
      <span
        className={[
          'flex size-[18px] shrink-0 items-center justify-center rounded-full border-2',
          active ? 'border-emerald-500' : 'border-slate-400',
        ].join(' ')}
      >
        {active && <span className="size-2.5 rounded-full bg-emerald-500" />}
      </span>
      <span className="text-sm font-medium text-slate-950">{label}</span>
    </button>
  );
}
