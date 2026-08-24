"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { CalendarSearch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/axios";
import { formatKwh } from "@/lib/utils";
import type { EnergyUsageTimelineDTO } from "@/feat/dashboard/dto";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "last_week", label: "Last week" },
  { value: "last_month", label: "Last month" },
  { value: "last_year", label: "Last year" },
] as const;

export function EnergyUsageTimelineTab() {
  const [range, setRange] = useState<(typeof RANGES)[number]["value"]>("today");
  const [data, setData] = useState<EnergyUsageTimelineDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<EnergyUsageTimelineDTO>(`/dashboard/energy-usage-timeline`, { params: { range } })
      .then((res) => !cancelled && setData(res.data))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <Card className="flex w-full flex-col items-end gap-4 p-6">
      <div className="flex w-full items-center justify-between">
        <p className="text-lg font-semibold text-emerald-500">Energy usage timeline</p>
        <div className="flex items-center gap-2">
          <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <TabsList>
              {RANGES.map((r) => (
                <TabsTrigger key={r.value} value={r.value} className="w-[100px]">
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

      {loading || !data ? (
        <Skeleton className="h-[280px] w-full" />
      ) : (
        <>
          <div className="flex w-full gap-2 text-sm">
            <StatChip label="Current" value={data.current} tone="default" />
            <StatChip label="Peak" value={data.peak} tone="danger" />
            <StatChip label="Avg" value={data.average} tone="default" />
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => formatKwh(value, 0)} />
                <Line type="monotone" dataKey="kwh" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
}

function StatChip({ label, value, tone }: { label: string; value: number; tone: "default" | "danger" }) {
  return (
    <div
      className={
        "flex items-center gap-1 rounded-md border border-slate-400 px-2 py-1 " +
        (tone === "danger" ? "text-status-error" : "text-slate-950")
      }
    >
      <span>{label}</span>
      <span className="font-medium">{formatKwh(value)}</span>
    </div>
  );
}
