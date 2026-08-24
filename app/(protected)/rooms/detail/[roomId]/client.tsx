"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ListFilter } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticCard } from "@/components/shared/analytic-card";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate, formatKwh } from "@/lib/utils";
import { getRoomDevicesColumns } from "@/column/room-devices";
import { roomsApi } from "@/feat/rooms/api";
import type { RoomDetailDTO, RoomDeviceDTO } from "@/feat/rooms/dto";

interface RoomDetailClientProps {
  room: RoomDetailDTO;
  initialDevices: RoomDeviceDTO[];
}

export function RoomDetailClient({ room, initialDevices }: RoomDetailClientProps) {
  const [devices, setDevices] = useState(initialDevices);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = devices.filter((d) => d.tbDeviceId.includes(search) || d.deviceEui.includes(search));
  const online = devices.filter((d) => d.isPowerOn).length;

  const columns = useMemo(
    () =>
      getRoomDevicesColumns({
        isSelected: (id) => selected.has(id),
        onToggleSelect: (id) =>
          setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          }),
        onTogglePower: (device) =>
          setDevices((prev) =>
            prev.map((d) => (d.id === device.id ? { ...d, isPowerOn: !d.isPowerOn } : d))
          ),
        onViewLog: (device) => (window.location.href = `/rooms/detail/${room.id}/devices/${device.id}/log`),
        onDelete: async (device) => {
          if (!confirm(`Delete ${device.tbDeviceId}?`)) return;
          setDevices((prev) => prev.filter((d) => d.id !== device.id));
        },
        onIntervalChange: (device, minutes) => {
          if (minutes < 15) return;
          setDevices((prev) =>
            prev.map((d) => (d.id === device.id ? { ...d, intervalMinutes: minutes } : d))
          );
        },
      }),
    [selected, room.id]
  );

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <div className="flex w-full items-start gap-1">
        <Link
          href="/rooms"
          aria-label="Back to rooms"
          className="mt-1 flex size-8 items-center justify-center rounded-md border border-slate-400 bg-white"
        >
          <ArrowLeft className="size-4 text-slate-950" />
        </Link>

        <div className="flex flex-1 flex-col gap-1">
          <h1 className="font-display text-[36px] font-bold leading-[44px] tracking-[-0.72px] text-emerald-500">
            {room.name}
          </h1>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>
              Created at: <span className="text-slate-950">{room.location}</span>
            </span>
            <span>
              Created at: <span className="text-slate-950">{formatDate(room.createdAt)}</span>
            </span>
            <span>
              Last updated: <span className="text-slate-950">{room.lastUpdatedAt ? formatDate(room.lastUpdatedAt) : "-"}</span>
            </span>
          </div>
          <p className="text-xs text-slate-600">{room.description}</p>
        </div>
      </div>

      <div className="flex w-full items-stretch gap-2.5">
        <AnalyticCard title="Total usage(24H)" value={formatKwh(room.usage.total24hKwh, 0).replace(" kWh", "")} unit="kWh" />
        <AnalyticCard title="Avg usage(24H)" value={formatKwh(room.usage.avg24hKwh, 0).replace(" kWh", "")} unit="kWh" />
        <AnalyticCard title="Peak usage" value={formatKwh(room.usage.peakKwh, 0).replace(" kWh", "")} unit="kWh" tone="red" />
        <AnalyticCard
          title="Highest component"
          value={formatKwh(room.usage.highestComponent.kwh, 0).replace(" kWh", "")}
          unit={room.usage.highestComponent.name}
          tone="red"
        />
      </div>

      <div className="flex w-full flex-col items-end gap-4 rounded-xl border border-slate-400 bg-white p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.04)]">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-emerald-500">{devices.length} device(s)</p>
            <p className="text-xs text-[#444651]">
              <span className="text-emerald-500">{online} Online</span> · {devices.length - online} Offline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search device EUI" />
            <Button variant="outline" size="sm" className="w-[150px] justify-between">
              <ListFilter className="size-4" /> Filter by role
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={filtered.length > 0 && filtered.every((d) => selected.has(d.id))}
                  onCheckedChange={() =>
                    setSelected(
                      filtered.every((d) => selected.has(d.id)) ? new Set() : new Set(filtered.map((d) => d.id))
                    )
                  }
                />
              </TableHead>
              <TableHead>Device(s)</TableHead>
              <TableHead>Component</TableHead>
              <TableHead>Total usage(24H)</TableHead>
              <TableHead>Interval</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((device) => (
              <TableRow key={device.id}>
                <TableCell>{columns.checkbox(device)}</TableCell>
                <TableCell>{columns.device(device)}</TableCell>
                <TableCell>{columns.component(device)}</TableCell>
                <TableCell>{columns.usage(device)}</TableCell>
                <TableCell>{columns.interval(device)}</TableCell>
                <TableCell>{columns.status(device)}</TableCell>
                <TableCell>{columns.action(device)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
