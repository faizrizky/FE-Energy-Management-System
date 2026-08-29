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
import { formatKwh } from '@/lib/utils';
import { useTableSort } from '@/lib/use-table-sort';
import type { RiskyRoomDTO } from '@/feat/dashboard/dto';

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'last_week', label: 'Last week' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_year', label: 'Last year' },
] as const;

interface TopRiskyRoomsTabProps {
  dataByRange: Record<string, RiskyRoomDTO[]>;
}

export function TopRiskyRoomsTab({ dataByRange }: TopRiskyRoomsTabProps) {
  const [range, setRange] = useState<(typeof RANGES)[number]['value']>('today');
  const rooms = dataByRange[range] ?? [];

  const { sorted, sortKey, direction, toggleSort } = useTableSort(rooms, {
    name: (r) => r.name,
    peak: (r) => r.peakUsageKwh,
    avg: (r) => r.avgUsageKwh,
    total: (r) => r.totalUsageKwh,
  });

  return (
    <Card className="flex w-full flex-col items-end gap-4 p-6">
      <div className="flex w-full items-center justify-between">
        <p className="text-lg font-semibold text-emerald-500">
          Top 5 risky room
        </p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-400 bg-white p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={[
                  'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                  range === r.value
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-500 hover:bg-slate-50',
                ].join(' ')}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button className="flex size-9 items-center justify-center rounded-md border border-slate-400 bg-slate-50">
            <CalendarSearch className="size-4 text-slate-600" />
          </button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <p className="w-full py-10 text-center text-sm text-slate-500">
          No data available.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                sortKey="name"
                activeKey={sortKey}
                direction={direction}
                onSort={toggleSort}
              >
                Room
              </SortableTableHead>
              <TableHead>Highest component</TableHead>
              <SortableTableHead
                sortKey="peak"
                activeKey={sortKey}
                direction={direction}
                onSort={toggleSort}
              >
                Peak usage
              </SortableTableHead>
              <SortableTableHead
                sortKey="avg"
                activeKey={sortKey}
                direction={direction}
                onSort={toggleSort}
              >
                Avg usage
              </SortableTableHead>
              <SortableTableHead
                sortKey="total"
                activeKey={sortKey}
                direction={direction}
                onSort={toggleSort}
              >
                Total usage
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((room) => (
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
