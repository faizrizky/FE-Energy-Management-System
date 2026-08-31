'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { ScheduleForm } from './form';
import { scheduleClientApi } from '@/feat/schedule/api.client';
import { toDateInputValue } from '@/feat/schedule/time';
import type { ScheduleDTO } from '@/feat/schedule/dto';
import type { ScheduleFormValues } from '@/feat/schedule/schema';
import type { RoomListItemDTO } from '@/feat/rooms/dto';
import type { DeviceDTO } from '@/feat/device/dto';

interface ScheduleFormModalProps {
  open: boolean;
  schedule?: ScheduleDTO;
  rooms: RoomListItemDTO[];
  devices: DeviceDTO[];
  onOpenChange: (open: boolean) => void;
  onSuccess: (schedule: ScheduleDTO) => void;
}

export function ScheduleFormModal({
  open,
  schedule,
  rooms,
  devices,
  onOpenChange,
  onSuccess,
}: ScheduleFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const defaultValues: Partial<ScheduleFormValues> = schedule
    ? {
        roomId: schedule.roomId,
        deviceId: schedule.deviceId ?? '',
        action: schedule.action,
        scheduledDate: toDateInputValue(schedule.scheduledDate),
        startTime: schedule.startTime,
        endTime: schedule.endTime ?? '',
        repeatType: schedule.repeatType,
        repeatDays: schedule.repeatDays ?? [],
      }
    : {
        roomId: '',
        deviceId: '',
        action: 'on',
        scheduledDate: toDateInputValue(new Date().toISOString()),
        startTime: '08:00',
        endTime: '',
        repeatType: 'none',
        repeatDays: [],
      };

  const handleSubmit = async (values: ScheduleFormValues) => {
    setSubmitting(true);
    try {
      const saved = schedule
        ? await scheduleClientApi.update(schedule.id, values)
        : await scheduleClientApi.create(values);
      onSuccess(saved);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.5)] p-4 backdrop-blur-[5px]">
      <div className="flex max-h-[90vh] w-full max-w-[700px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0px_8px_12px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-emerald-500">
            {schedule ? 'Edit schedule' : 'Add schedule'}
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
          <ScheduleForm
            rooms={rooms}
            devices={devices}
            defaultValues={defaultValues}
            schedule={schedule}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  );
}
