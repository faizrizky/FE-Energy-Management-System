'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { ScheduleForm } from './form';
import { scheduleClientApi } from '@/feat/schedule/api.client';
import type { ScheduleDTO } from '@/feat/schedule/dto';
import type { ScheduleFormValues } from '@/feat/schedule/schema';
import type { RoomListItemDTO } from '@/feat/rooms/dto';

interface ScheduleFormModalProps {
  open: boolean;
  schedule?: ScheduleDTO;
  rooms: RoomListItemDTO[];
  onOpenChange: (open: boolean) => void;
  onSuccess: (schedule: ScheduleDTO) => void;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * Modal tambah/edit schedule: ngisi default dari data lama, manggil
 * create/update API, terus ngabarin parent lewat onSuccess.
 *
 * Dipake di: schedule/client.tsx.
 */
export function ScheduleFormModal({
  open,
  schedule,
  rooms,
  onOpenChange,
  onSuccess,
}: ScheduleFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const defaultValues: Partial<ScheduleFormValues> = schedule
    ? {
        name: schedule.name,
        description: schedule.description ?? '',
        roomId: schedule.roomId,
        action: schedule.action,
        startTime: schedule.startTime,
        durationConstraint: schedule.endTime ? 'end-at' : 'no-end',
        endTime: schedule.endTime ?? '',
        // "daily" udah gak ada di form baru (toggle repeat cuma none/weekly);
        // jadwal lama yang masih "daily" ditampilin sebagai weekly, semua
        // hari kecentang, biar visualnya tetap "tiap hari".
        repeatType: schedule.repeatType === 'none' ? 'none' : 'weekly',
        repeatDays:
          schedule.repeatType === 'daily'
            ? ALL_DAYS
            : schedule.repeatDays ?? [],
      }
    : {
        name: '',
        description: '',
        roomId: '',
        action: 'on',
        startTime: '08:00',
        durationConstraint: 'no-end',
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
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      panelClassName="flex max-h-[90vh] w-full max-w-[90vh] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0px_8px_12px_rgba(0,0,0,0.15)] gap-2"
    >
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
          defaultValues={defaultValues}
          schedule={schedule}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitting={submitting}
        />
      </div>
      {/* </div>
    </div> */}
    </Modal>
  );
}
