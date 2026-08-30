'use client';

import { useMemo, useState } from 'react';
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
import type { DeviceDTO } from '@/feat/device/dto';
import type { ScheduleDTO } from '@/feat/schedule/dto';

interface ScheduleFormProps {
  rooms: RoomListItemDTO[];
  devices: DeviceDTO[];
  defaultValues?: Partial<ScheduleFormValues>;
  schedule?: ScheduleDTO;
  onSubmit: (values: ScheduleFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

const DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' },
];

export function ScheduleForm({
  rooms,
  devices,
  defaultValues,
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
      roomId: '',
      deviceId: '',
      action: 'on',
      scheduledDate: '',
      startTime: '08:00',
      endTime: '',
      repeatType: 'none',
      repeatDays: [],
      ...defaultValues,
    },
  });

  const roomId = watch('roomId');
  const repeatType = watch('repeatType');
  const repeatDays = watch('repeatDays');

  // Devices already came down from the server component — filtering by
  // room is a plain derived value, no fetch and no effect needed.
  const roomDevices = useMemo(
    () => devices.filter((device) => device.roomId === roomId),
    [devices, roomId]
  );

  const roomRegister = register('roomId');

  const toggleDay = (day: number) => {
    const current = repeatDays ?? [];
    if (current.includes(day)) {
      setValue(
        'repeatDays',
        current.filter((value) => value !== day),
        { shouldValidate: true }
      );
    } else {
      setValue(
        'repeatDays',
        [...current, day].sort((a, b) => a - b),
        {
          shouldValidate: true,
        }
      );
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

      {/* ROOM + DEVICE */}
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Choose room"
          required
          error={errors.roomId?.message}
          hint="Choose one room to schedule the action"
        >
          <SelectField>
            <select
              {...roomRegister}
              onChange={(e) => {
                roomRegister.onChange(e);
                setValue('deviceId', '');
              }}
              className="h-11 w-full appearance-none rounded-lg border border-slate-400 bg-white px-3 pr-10 text-sm text-slate-950 outline-none shadow-[0_1px_2px_rgba(0,0,0,0.1)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Choose room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </SelectField>
        </Field>

        <Field
          label="Choose device"
          error={errors.deviceId?.message}
          hint="Leave empty to schedule the whole room"
        >
          <SelectField>
            <select
              {...register('deviceId')}
              disabled={!roomId}
              className="h-11 w-full appearance-none rounded-lg border border-slate-400 bg-white px-3 pr-10 text-sm text-slate-950 outline-none shadow-[0_1px_2px_rgba(0,0,0,0.1)] disabled:bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Whole room</option>
              {roomDevices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.eui} - {device.name}
                </option>
              ))}
            </select>
          </SelectField>
        </Field>
      </div>

      {/* ACTION + DATE */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Action" required error={errors.action?.message}>
          <SelectField>
            <select
              {...register('action')}
              className="h-11 w-full appearance-none rounded-lg border border-slate-400 bg-white px-3 pr-10 text-sm text-slate-950 outline-none shadow-[0_1px_2px_rgba(0,0,0,0.1)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="on">Turn ON</option>
              <option value="off">Turn OFF</option>
            </select>
          </SelectField>
        </Field>

        <Field
          label="Choose date"
          required
          error={errors.scheduledDate?.message}
        >
          <Input
            type="date"
            {...register('scheduledDate')}
            aria-invalid={!!errors.scheduledDate}
            className="h-11 rounded-lg border-slate-400 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
          />
        </Field>
      </div>

      {/* TIME */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start time" required error={errors.startTime?.message}>
          <Input
            type="time"
            {...register('startTime')}
            aria-invalid={!!errors.startTime}
            className="h-11 rounded-lg border-slate-400 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
          />
        </Field>

        <Field
          label="End time"
          error={errors.endTime?.message}
          hint="Optional. Supports cross-midnight ranges."
        >
          <Input
            type="time"
            {...register('endTime')}
            aria-invalid={!!errors.endTime}
            className="h-11 rounded-lg border-slate-400 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
          />
        </Field>
      </div>

      {/* REPEAT */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between py-2">
          <p className="text-sm font-medium text-neutral-500">Repeat?</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={repeatType !== 'none'}
              onClick={() => {
                setValue(
                  'repeatType',
                  repeatType === 'none' ? 'weekly' : 'none',
                  {
                    shouldValidate: true,
                  }
                );
                if (repeatType === 'none') setValue('repeatDays', []);
              }}
              className={[
                'relative h-6 w-11 rounded-full transition',
                repeatType !== 'none' ? 'bg-emerald-700' : 'bg-slate-300',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition',
                  repeatType !== 'none' ? 'left-[22px]' : 'left-0.5',
                ].join(' ')}
              />
            </button>
            <span className="text-sm text-emerald-700">
              {repeatType !== 'none' ? 'Repeat on' : 'Repeat off'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <RepeatOption
            active={repeatType === 'none'}
            title="Does not repeat"
            description="Runs once"
            onClick={() =>
              setValue('repeatType', 'none', { shouldValidate: true })
            }
          />
          <RepeatOption
            active={repeatType === 'daily'}
            title="Every day"
            description="Runs every day"
            onClick={() =>
              setValue('repeatType', 'daily', { shouldValidate: true })
            }
          />
          <RepeatOption
            active={repeatType === 'weekly'}
            title="Every week"
            description="Choose days"
            onClick={() =>
              setValue('repeatType', 'weekly', { shouldValidate: true })
            }
          />
        </div>
      </div>

      {repeatType === 'weekly' && (
        <div className="rounded-xl border border-emerald-500 bg-emerald-50 p-4 shadow-[0_8px_12px_rgba(0,0,0,0.05)]">
          <p className="mb-3 text-sm font-medium text-emerald-500">Repeat on</p>
          <div className="grid grid-cols-4 gap-2">
            {DAYS.map((day) => {
              const selected = repeatDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={[
                    'rounded-lg border px-3 py-2 text-xs font-medium transition',
                    selected
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400',
                  ].join(' ')}
                >
                  {day.short}
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
      )}

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
          {submitting ? 'Saving...' : 'Save schedule'}
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

function SelectField({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full">
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-700" />
    </div>
  );
}

function RepeatOption({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex min-h-[68px] flex-col items-start justify-center rounded-xl border p-4 text-left shadow-[0_8px_12px_rgba(0,0,0,0.05)] transition',
        active
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-slate-300 bg-white hover:border-emerald-300',
      ].join(' ')}
    >
      <span
        className={[
          'text-sm font-medium leading-5',
          active ? 'text-emerald-500' : 'text-slate-950',
        ].join(' ')}
      >
        {title}
      </span>
      <span className="mt-1 text-[10px] leading-[18px] text-slate-950">
        {description}
      </span>
    </button>
  );
}
