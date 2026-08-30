'use client';

import { X } from 'lucide-react';
import type { ScheduleDTO } from '@/feat/schedule/dto';
import {
  formatScheduleDate,
  formatScheduleDateTime,
  dayName,
} from '@/feat/schedule/time';

interface ScheduleDetailModalProps {
  schedule: ScheduleDTO | null;
  onClose: () => void;
}

export function ScheduleDetailModal({
  schedule,
  onClose,
}: ScheduleDetailModalProps) {
  if (!schedule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.5)] p-4 backdrop-blur-[10px]">
      <div className="flex max-h-[90vh] w-full max-w-[500px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0px_8px_12px_rgba(0,0,0,0.15)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-emerald-500">
              {schedule.room?.name ?? schedule.roomId}{' '}
              {schedule.device?.deviceType ?? 'Room'}
            </h2>
            <StatusBadge status={schedule.status} />
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

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5">
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
              <InfoRow label="Action" value={schedule.action.toUpperCase()} />
              <InfoRow
                label="Created at"
                value={formatScheduleDateTime(schedule.createdAt)}
              />
              <InfoRow
                label="Last updated"
                value={formatScheduleDateTime(schedule.updatedAt)}
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
            <p className="mb-3 text-xs text-slate-600">Timing & recurrence</p>
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

          <section>
            <p className="mb-3 text-xs text-slate-600">Recent Activity Log</p>
            <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              Activity logs for schedules are not exposed by the current
              schedule API.
            </div>
          </section>
        </div>
      </div>
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
        'inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
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

function formatRepeat(schedule: ScheduleDTO) {
  if (schedule.repeatType === 'daily') return 'Every day';
  if (schedule.repeatType === 'weekly') {
    if (!schedule.repeatDays?.length) return 'Every week';
    return schedule.repeatDays.map(dayName).join(', ');
  }
  return 'Does not repeat';
}
