'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { CalendarSearch } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatKwh } from '@/lib/utils';
import type { EnergyUsageTimelineDTO } from '@/feat/dashboard/dto';

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'last_week', label: 'Last week' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_year', label: 'Last year' },
] as const;

interface EnergyUsageTimelineTabProps {
  dataByRange: Record<string, EnergyUsageTimelineDTO>;
}

export function EnergyUsageTimelineTab({
  dataByRange,
}: EnergyUsageTimelineTabProps) {
  const [range, setRange] = useState<(typeof RANGES)[number]['value']>('today');
  const data = dataByRange[range];

  return (
    <Card className="flex w-full flex-col items-end gap-4 p-2 md:p-6">
      <div className="flex w-full items-center justify-between">
        <p className="text-lg font-semibold text-emerald-500">
          Energy usage timeline
        </p>
        <div className="flex items-center gap-2">
          <div className="flex w-full flex-col gap-1 rounded-lg border border-slate-400 bg-white p-1 md:w-auto md:flex-row md:items-center">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={[
                  'h-11 rounded-md px-3 py-1 text-xs font-medium transition-colors md:h-auto md:text-sm',
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

      {!data ? (
        <p className="w-full py-10 text-center text-sm text-slate-500">
          No data available.
        </p>
      ) : (
        <>
          <div className="flex w-full gap-2 text-sm">
            <StatChip label="Current" value={data.current} tone="default" />
            <StatChip label="Peak" value={data.peak} tone="danger" />
            <StatChip label="Avg" value={data.average} tone="default" />
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.points}
                margin={{ top: 20, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(value: number) => formatKwh(value, 0)} />
                <Line
                  type="monotone"
                  dataKey="kwh"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#10b981' }}
                  label={(props: any) => {
                    const { x, y, value } = props;
                    return (
                      <text
                        x={x}
                        y={y - 10}
                        fill="#10b981"
                        fontSize={11}
                        textAnchor="middle"
                      >
                        {value} kWh
                      </text>
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'default' | 'danger';
}) {
  return (
    <div
      className={
        'flex items-center gap-1 rounded-md border border-slate-400 px-2 py-1 ' +
        (tone === 'danger' ? 'text-status-error' : 'text-slate-950')
      }
    >
      <span>{label}</span>
      <span className="font-medium">{formatKwh(value)}</span>
    </div>
  );
}
