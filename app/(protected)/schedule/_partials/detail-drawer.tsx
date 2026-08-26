'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ScheduleDTO } from '@/feat/schedule/dto';
import { scheduleClientApi } from '@/feat/schedule/api.client';
import {
  formatScheduleDate,
  formatScheduleDateTime,
  dayName,
} from '@/feat/schedule/time';

interface ScheduleDetailDrawerProps {
  scheduleId: string | null;

  onClose: () => void;
}

export function ScheduleDetailDrawer({
  scheduleId,
  onClose,
}: ScheduleDetailDrawerProps) {
  const [schedule, setSchedule] = useState<ScheduleDTO | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!scheduleId) {
      setSchedule(null);
      return;
    }

    setLoading(true);

    scheduleClientApi
      .getById(scheduleId)
      .then(setSchedule)
      .finally(() => {
        setLoading(false);
      });
  }, [scheduleId]);

  if (!scheduleId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[450px] flex-col border-l border-slate-300 bg-white p-6 shadow-[0px_8px_12px_rgba(0,0,0,0.05)]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Loading schedule...
          </div>
        ) : !schedule ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Schedule not found.
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-emerald-500">
                  {schedule.room?.name ?? 'Schedule'}{' '}
                  {schedule.device?.deviceType
                    ? schedule.device.deviceType
                    : 'Room'}
                </h2>

                <div className="mt-2">
                  <StatusBadge status={schedule.status} />
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="size-5 text-slate-500" />
              </button>
            </div>

            <div className="my-5 h-px bg-slate-200" />

            <div className="flex flex-col gap-6 overflow-y-auto">
              <section>
                <p className="mb-3 text-xs text-slate-600">Basic information</p>

                <div className="flex flex-col gap-3 rounded-xl border border-neutral-300 p-4 text-sm shadow-[0px_8px_12px_rgba(0,0,0,0.05)]">
                  <InfoRow
                    label="Room"
                    value={schedule.room?.name ?? schedule.roomId}
                  />

                  <InfoRow
                    label="Component"
                    value={schedule.device?.deviceType ?? 'Room'}
                  />

                  <InfoRow
                    label="Device EUI"
                    value={schedule.device?.eui ?? 'Room level'}
                  />

                  <InfoRow
                    label="Action"
                    value={schedule.action.toUpperCase()}
                  />

                  <InfoRow
                    label="Created at"
                    value={formatScheduleDateTime(schedule.createdAt)}
                  />

                  <InfoRow
                    label="Last updated"
                    value={formatDateTime(schedule.updatedAt)}
                  />

                  {schedule.createdBy && (
                    <InfoRow
                      label="Created by"
                      value={schedule.createdBy.fullName}
                    />
                  )}
                </div>
              </section>

              <section>
                <p className="mb-3 text-xs text-slate-600">
                  Timing & recurrence
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-neutral-300 p-4 shadow-[0px_8px_12px_rgba(0,0,0,0.05)]">
                    <p className="text-sm font-medium text-neutral-500">
                      Execution time
                    </p>

                    <p className="mt-1 text-sm text-slate-950">
                      {formatScheduleDate(schedule.scheduledDate)}
                    </p>

                    <p className="text-sm text-slate-950">
                      {schedule.startTime}

                      {schedule.endTime ? ` - ${schedule.endTime}` : ''}
                    </p>
                  </div>

                  <div className="rounded-xl border border-neutral-300 p-4 shadow-[0px_8px_12px_rgba(0,0,0,0.05)]">
                    <p className="text-sm font-medium text-neutral-500">
                      Recurrence
                    </p>

                    <p className="mt-1 text-sm text-slate-950">
                      {formatRepeat(schedule)}
                    </p>
                  </div>
                </div>
              </section>

              {/* <section>
                <p className="mb-3 text-xs text-slate-600">
                  Schedule information
                </p>

                <div className="rounded-xl border border-neutral-300 p-4 text-sm shadow-[0px_8px_12px_rgba(0,0,0,0.05)]">
                  <InfoRow label="Repeat type" value={schedule.repeatType} />

                  <InfoRow
                    label="Repeat days"
                    value={
                      schedule.repeatDays?.length
                        ? schedule.repeatDays.map(dayName).join(', ')
                        : '-'
                    }
                  />
                </div>
              </section> */}

              <section>
                <p className="mb-3 text-xs text-slate-600">
                  Recent Activity Log
                </p>

                <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  Activity logs for schedules are not exposed by the current
                  schedule API.
                </div>
              </section>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-medium text-neutral-500">{label}</span>

      <span className="text-right text-slate-950">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === 'active';

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
        active
          ? 'border-emerald-500 text-emerald-500'
          : 'border-slate-400 text-slate-500',
      ].join(' ')}
    >
      <span
        className={[
          'size-2 rounded-full',
          active ? 'bg-emerald-500' : 'bg-slate-400',
        ].join(' ')}
      />

      {status.toUpperCase()}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatRepeat(schedule: ScheduleDTO) {
  if (schedule.repeatType === 'daily') {
    return 'Every day';
  }

  if (schedule.repeatType === 'weekly') {
    if (!schedule.repeatDays?.length) {
      return 'Every week';
    }

    return schedule.repeatDays.map(dayName).join(', ');
  }

  return 'Does not repeat';
}
