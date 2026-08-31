'use client';

import { useMemo, useState } from 'react';
import { CalendarSearch } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SortableTableHead,
} from '@/components/ui/table';
import { useTableSort } from '@/lib/use-table-sort';
import {
  formatScheduleDate,
  formatTimeRange,
  isCurrentlyActive,
  isUpcoming,
} from '@/feat/schedule/time';
import type { ScheduleDTO } from '@/feat/schedule/dto';

const STATUS_TABS = [
  { value: 'active', label: 'Active schedule' },
  { value: 'upcoming', label: 'Upcoming schedule' },
] as const;

interface ActiveSchedulesTabProps {
  schedules: ScheduleDTO[];
}

export function ActiveSchedulesTab({ schedules }: ActiveSchedulesTabProps) {
  const [status, setStatus] =
    useState<(typeof STATUS_TABS)[number]['value']>('active');

  // sama biji sama kayak Schedule page (feat/schedule/time.ts) - gak bikin logic baru.
  const activeSchedules = useMemo(
    () => schedules.filter(isCurrentlyActive),
    [schedules]
  );
  const upcomingSchedules = useMemo(
    () => schedules.filter(isUpcoming),
    [schedules]
  );
  const rows = status === 'active' ? activeSchedules : upcomingSchedules;

  const { sorted, sortKey, direction, toggleSort } = useTableSort(rows, {
    room: (s) => s.room?.name ?? '',
    date: (s) => new Date(s.scheduledDate).getTime(),
  });

  return (
    <Card className="flex w-full flex-col items-end gap-4 p-2 md:p-6">
      {/* mobile */}
      <div className="flex w-full flex-col gap-3 md:hidden">
        <div className="flex w-full items-center justify-between">
          <p className="text-lg font-semibold text-emerald-500">
            Active Schedules
          </p>
          <button className="flex size-9 shrink-0 items-center justify-center rounded-md border border-slate-400 bg-slate-50">
            <CalendarSearch className="size-4 text-slate-600" />
          </button>
        </div>
        <div className="flex w-full flex-col gap-1 rounded-lg border border-slate-400 bg-white p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setStatus(t.value)}
              className={[
                'h-11 w-full rounded-md text-sm font-medium transition-colors',
                status === t.value
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-500',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* tablet/desktop */}
      <div className="hidden w-full items-center justify-between md:flex">
        <p className="text-lg font-semibold text-emerald-500">
          Active schedule
        </p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-400 bg-white p-1">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setStatus(t.value)}
                className={[
                  'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                  status === t.value
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-500 hover:bg-slate-50',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button className="flex size-9 items-center justify-center rounded-md border border-slate-400 bg-slate-50">
            <CalendarSearch className="size-4 text-slate-600" />
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="w-full py-10 text-center text-sm text-slate-500">
          No schedule found.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                sortKey="room"
                activeKey={sortKey}
                direction={direction}
                onSort={toggleSort}
              >
                Room
              </SortableTableHead>
              <TableHead>Component</TableHead>
              <TableHead>Device EUI</TableHead>
              <SortableTableHead
                sortKey="date"
                activeKey={sortKey}
                direction={direction}
                onSort={toggleSort}
              >
                Start Date
              </SortableTableHead>
              <TableHead>Time</TableHead>
              <TableHead>Repeat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex flex-col gap-0.5 py-1">
                    <span>{s.room?.name ?? s.roomId}</span>
                    <span className="text-[10px] text-slate-500">
                      {s.room?.location}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{s.device?.deviceType ?? 'Room'}</TableCell>
                <TableCell>{s.device?.eui ?? 'Room level'}</TableCell>
                <TableCell>{formatScheduleDate(s.scheduledDate)}</TableCell>
                <TableCell>{formatTimeRange(s.startTime, s.endTime)}</TableCell>
                <TableCell
                  className={
                    s.repeatType !== 'none'
                      ? 'text-emerald-500'
                      : 'text-status-error'
                  }
                >
                  {s.repeatType !== 'none' ? 'Yes' : 'No'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
