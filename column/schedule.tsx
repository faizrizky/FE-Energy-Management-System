import { ChevronRight, Eye, Pencil, Trash2 } from 'lucide-react';
import { TableActionButton } from '@/components/shared/table-action-button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatScheduleDate, formatTimeRange } from '@/feat/schedule/time';
import type {
  ScheduleAction,
  ScheduleActivityDTO,
  ScheduleDTO,
} from '@/feat/schedule/dto';

/**
 * Ringkasan aksi schedule: pill aksi awal, terus panah + pill aksi akhir kalo
 * schedule-nya punya jam selesai. Nilainya dibaca apa adanya dari backend
 * (field activity), bukan diturunin ulang di sini.
 *
 * Dipake di: getScheduleColumns.activity (file ini),
 *   schedule/_partials/schedule-card.tsx.
 */
export function ScheduleActivity({
  activity,
}: {
  activity: ScheduleActivityDTO;
}) {
  return (
    <div className="flex items-center gap-1">
      <PowerPill action={activity.start} />
      {activity.end && (
        <>
          <ChevronRight className="size-4 shrink-0 text-slate-950" />
          <PowerPill action={activity.end} />
        </>
      )}
    </div>
  );
}

/**
 * Pill status ON/OFF: hijau buat on, merah buat off.
 *
 * Dipake di: ScheduleActivity (file ini),
 *   schedule/_partials/detail-modal.tsx (Recent Activity Log).
 */
export function PowerPill({ action }: { action: ScheduleAction }) {
  const on = action === 'on';
  return (
    <span
      className={[
        'inline-flex h-7 shrink-0 items-center justify-center rounded-full border px-2.5 text-xs font-medium',
        on
          ? 'border-emerald-500 bg-emerald-50 text-emerald-500'
          : 'border-red-500 bg-red-50 text-red-500',
      ].join(' ')}
    >
      {on ? 'ON' : 'OFF'}
    </span>
  );
}

export interface ScheduleColumnHandlers {
  onToggleSelect: (id: string) => void;
  isSelected: (id: string) => boolean;
  onView: (schedule: ScheduleDTO) => void;
  onEdit: (schedule: ScheduleDTO) => void;
  onDelete: (schedule: ScheduleDTO) => void;
}

/**
 * Renderer tiap kolom tabel schedule: checkbox, room, nama, tanggal, jam,
 * pola ulang, tombol aksi.
 *
 * Dipake di: app/(protected)/schedule/client.tsx.
 */
export function getScheduleColumns({
  onToggleSelect,
  isSelected,
  onView,
  onEdit,
  onDelete,
}: ScheduleColumnHandlers) {
  return {
    checkbox: (schedule: ScheduleDTO) => (
      <Checkbox
        checked={isSelected(schedule.id)}
        onCheckedChange={() => onToggleSelect(schedule.id)}
      />
    ),
    schedule: (schedule: ScheduleDTO) => (
      <div className="flex flex-col gap-0.5 py-1">
        <span>{schedule.room?.name ?? schedule.roomId}</span>
        {schedule.room?.location && (
          <span className="text-[10px] text-slate-500">
            {schedule.room.location}
          </span>
        )}
      </div>
    ),
    name: (schedule: ScheduleDTO) => (
      <span className="text-slate-950">{schedule.name}</span>
    ),
    date: (schedule: ScheduleDTO) => (
      <span className="text-slate-500">
        {formatScheduleDate(schedule.scheduledDate)}
      </span>
    ),
    time: (schedule: ScheduleDTO) => (
      <span className="text-slate-500">
        {formatTimeRange(schedule.startTime, schedule.endTime)}
      </span>
    ),
    activity: (schedule: ScheduleDTO) => (
      <ScheduleActivity activity={schedule.activity} />
    ),
    repeat: (schedule: ScheduleDTO) => (
      <span
        className={
          schedule.repeatType !== 'none'
            ? 'text-xs text-green-500'
            : 'text-xs text-red-500'
        }
      >
        {schedule.repeatType !== 'none' ? 'Yes' : 'No'}
      </span>
    ),
    action: (schedule: ScheduleDTO) => (
      <div className="flex items-center gap-2">
        <TableActionButton
          icon={Eye}
          aria-label={`View schedule for ${schedule.room?.name ?? schedule.roomId}`}
          onClick={() => onView(schedule)}
        />
        <TableActionButton
          icon={Pencil}
          aria-label={`Edit schedule for ${schedule.room?.name ?? schedule.roomId}`}
          onClick={() => onEdit(schedule)}
        />
        <TableActionButton
          icon={Trash2}
          tone="destructive"
          aria-label={`Delete schedule for ${schedule.room?.name ?? schedule.roomId}`}
          onClick={() => onDelete(schedule)}
        />
      </div>
    ),
  };
}
