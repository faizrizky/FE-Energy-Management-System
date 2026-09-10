import { Pencil, Trash2 } from 'lucide-react';
import { formatScheduleDate, formatTimeRange } from '@/feat/schedule/time';
import type { ScheduleDTO } from '@/feat/schedule/dto';

interface ScheduleCardProps {
  schedule: ScheduleDTO;
  onEdit: (schedule: ScheduleDTO) => void;
  onDelete: (schedule: ScheduleDTO) => void;
}

export function ScheduleCard({
  schedule,
  onEdit,
  onDelete,
}: ScheduleCardProps) {
  const isRepeating = schedule.repeatType !== 'none';

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-base font-semibold text-slate-950">
          {schedule.room?.name}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label={`Edit ${schedule.room?.name}`}
            onClick={() => onEdit(schedule)}
            className="flex size-10 items-center justify-center rounded-md border border-slate-400 bg-white text-slate-950"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete schedule for ${schedule.room?.name}`}
            onClick={() => onDelete(schedule)}
            className="flex size-10 items-center justify-center rounded-md border border-status-error bg-white text-status-error"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Component</span>
          <p className="truncate text-base font-semibold text-slate-950">
            {schedule.device?.deviceType ?? 'Room'}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Device EUI</span>
          <p className="truncate text-base font-semibold text-slate-950">
            {schedule.device?.eui ?? 'Room level'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Start Date</span>
          <p className="truncate text-base font-semibold text-slate-950">
            {formatScheduleDate(schedule.scheduledDate)}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Time</span>
          <p className="truncate text-base font-semibold text-slate-950">
            {formatTimeRange(schedule.startTime, schedule.endTime)}
          </p>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">Repeat status</span>
        <span
          className={[
            'inline-flex items-center rounded-full border px-3 py-3 text-xs font-medium',
            isRepeating
              ? 'border-emerald-500 text-emerald-500'
              : 'border-slate-300 text-slate-500',
          ].join(' ')}
        >
          {isRepeating ? 'Repeat' : 'No repeat'}
        </span>
      </div>
    </div>
  );
}
