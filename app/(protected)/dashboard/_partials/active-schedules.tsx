'use client';

import { useState } from 'react';
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
import { formatScheduleDate } from '@/feat/schedule/time';
import type { ActiveScheduleDTO } from '@/feat/dashboard/dto';

const STATUS_TABS = [
  { value: 'active', label: 'Active schedule' },
  { value: 'upcoming', label: 'Upcoming schedule' },
] as const;

interface ActiveSchedulesTabProps {
  activeSchedules: ActiveScheduleDTO[];
  upcomingSchedules: ActiveScheduleDTO[];
}

// Module-level, bukan inline di dalam komponen - biar identity-nya stabil
// dan useTableSort beneran bisa nge-cache (lihat catatan performa di audit).
const SCHEDULE_SORT_ACCESSORS = {
  room: (s: ActiveScheduleDTO) => s.roomName,
  date: (s: ActiveScheduleDTO) => new Date(s.startDate).getTime(),
};

export function ActiveSchedulesTab({
  activeSchedules,
  upcomingSchedules,
}: ActiveSchedulesTabProps) {
  const [status, setStatus] =
    useState<(typeof STATUS_TABS)[number]['value']>('active');

  // Data sudah difilter server-side (reportUseCase.getActiveSchedules), jadi
  // di sini tinggal pilih array-nya, gak perlu filter ulang di client.
  const rows = status === 'active' ? activeSchedules : upcomingSchedules;

  const { sorted, sortKey, direction, toggleSort } = useTableSort(
    rows,
    SCHEDULE_SORT_ACCESSORS
  );

  return (
    <Card className="flex w-full flex-col items-end gap-4 p-2 md:p-6">
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
                    <span>{s.roomName}</span>
                    <span className="text-[10px] text-slate-500">
                      {s.roomLocation}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{s.component}</TableCell>
                <TableCell>{s.deviceEui}</TableCell>
                <TableCell>{formatScheduleDate(s.startDate)}</TableCell>
                <TableCell>{s.time}</TableCell>
                <TableCell
                  className={
                    s.repeat ? 'text-emerald-500' : 'text-status-error'
                  }
                >
                  {s.repeat ? 'Yes' : 'No'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
