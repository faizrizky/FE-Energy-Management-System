import { Eye, Pencil, Trash2 } from 'lucide-react';
import { StatusDot } from '@/components/shared/status-dot';
import { TableActionButton } from '@/components/shared/table-action-button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatScheduleDate, formatTimeRange } from '@/feat/schedule/time';
import type { ScheduleDTO } from '@/feat/schedule/dto';

export interface ScheduleColumnHandlers {
  onToggleSelect: (id: string) => void;
  isSelected: (id: string) => boolean;
  onView: (schedule: ScheduleDTO) => void;
  onEdit: (schedule: ScheduleDTO) => void;
  onDelete: (schedule: ScheduleDTO) => void;
}

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
    room: (schedule: ScheduleDTO) => (
      <div className="flex flex-col gap-0.5 py-1">
        <span>{schedule.room?.name ?? schedule.roomId}</span>
        {schedule.room?.location && (
          <span className="text-[10px] text-slate-500">
            {schedule.room.location}
          </span>
        )}
      </div>
    ),
    component: (schedule: ScheduleDTO) => (
      <span className="text-slate-500">
        {schedule.device?.deviceType ?? 'Room'}
      </span>
    ),
    deviceEui: (schedule: ScheduleDTO) => (
      <span className="text-slate-500">
        {schedule.device?.eui ?? 'Room level'}
      </span>
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
