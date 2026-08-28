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
import { formatKwh } from '@/lib/utils';
import type { RiskyRoomDTO } from '@/feat/dashboard/dto';

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'last_week', label: 'Last week' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_year', label: 'Last year' },
] as const;

export function TopRiskyRoomsTab() {
  const [range, setRange] = useState<(typeof RANGES)[number]['value']>('today');
  const [rooms, setRooms] = useState<RiskyRoomDTO[] | null>(null);

  // useEffect(() => {
  //   let cancelled = false;
  //   setRooms(null);
  //   api
  //     .get<RiskyRoomDTO[]>("/dashboard/top-risky-rooms", { params: { range } })
  //     .then((res) => !cancelled && setRooms(res.data));
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [range]);

  return (
    <Card className="flex w-full flex-col items-end gap-4 p-6">
      <div className="flex w-full items-center justify-between">
        <p className="text-lg font-semibold text-emerald-500">
          Top 5 risky room
        </p>
        <div className="flex items-center gap-2">
          <Tabs
            value={range}
            onValueChange={(v) => setRange(v as typeof range)}
          >
            <TabsList>
              {RANGES.map((r) => (
                <TabsTrigger
                  key={r.value}
                  value={r.value}
                  className="w-[100px]"
                >
                  {r.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <button className="flex size-8 items-center justify-center rounded-md border border-slate-400 bg-slate-50">
            <CalendarSearch className="size-4 text-slate-600" />
          </button>
        </div>
      </div>

      {!rooms ? (
        <Skeleton className="h-[280px] w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead>Highest component</TableHead>
              <TableHead>Peak usage</TableHead>
              <TableHead>Avg usage</TableHead>
              <TableHead>Total usage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell>
                  <div className="flex flex-col gap-0.5 py-1">
                    <span>{room.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {room.location}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {room.highestComponent} -{' '}
                  {formatKwh(room.highestComponentKwh, 0)}
                </TableCell>
                <TableCell>{formatKwh(room.peakUsageKwh)}</TableCell>
                <TableCell>{formatKwh(room.avgUsageKwh)}</TableCell>
                <TableCell>{formatKwh(room.totalUsageKwh)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
