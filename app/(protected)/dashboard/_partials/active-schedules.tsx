'use client';

import { useEffect, useState } from 'react';
import { CalendarSearch } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/axios';
import { formatDate } from '@/lib/utils';
import type { ActiveScheduleDTO } from '@/feat/dashboard/dto';

const STATUS_TABS = [
  { value: 'active', label: 'Active schedule' },
  { value: 'upcoming', label: 'Upcoming schedule' },
] as const;

export function ActiveSchedulesTab() {
  const [status, setStatus] =
    useState<(typeof STATUS_TABS)[number]['value']>('active');
  const [schedules, setSchedules] = useState<ActiveScheduleDTO[] | null>(null);

  // useEffect(() => {
  //   let cancelled = false;
  //   setSchedules(null);
  //   api
  //     .get<ActiveScheduleDTO[]>('/dashboard/schedules', { params: { status } })
  //     .then((res) => !cancelled && setSchedules(res.data));
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [status]);

  return (
    <Card className="flex w-full flex-col items-end gap-4 p-6">
      <div className="flex w-full items-center justify-between">
        <p className="text-lg font-semibold text-emerald-500">
          Active schedule
        </p>
        <div className="flex items-center gap-2">
          <Tabs
            value={status}
            onValueChange={(v) => setStatus(v as typeof status)}
          >
            <TabsList>
              {STATUS_TABS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="w-[150px]"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <button className="flex size-8 items-center justify-center rounded-md border border-slate-400 bg-slate-50">
            <CalendarSearch className="size-4 text-slate-600" />
          </button>
        </div>
      </div>

      {!schedules ? (
        <Skeleton className="h-[280px] w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead>Component</TableHead>
              <TableHead>Device EUI</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Repeat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((s) => (
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
                <TableCell>{formatDate(s.startDate)}</TableCell>
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
