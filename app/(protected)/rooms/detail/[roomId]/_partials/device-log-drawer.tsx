"use client";

import { useEffect, useState } from "react";
import { X, Download, Search } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { roomsApi } from "@/feat/rooms/api";
import type { RoomDeviceDTO, RoomDeviceLogEntryDTO } from "@/feat/rooms/dto";

interface DeviceLogDrawerProps {
  device: RoomDeviceDTO | null;
  roomId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Slide-over drawer for device command/audit log (Figma: "Rooms - device
 * list - log", node 18:9603 — the layer inside is literally named "Detail
 * schedule" but it's actually the log history panel; treat it as a drawer
 * over the room detail page, NOT a separate route).
 *
 * BACKEND GAP: `roomsApi.getDeviceLog` points at a route that doesn't exist
 * yet (`GET /rooms/:roomId/devices/:deviceId/logs`). The closest existing
 * piece server-side is the unused `CommandLog` Prisma model — it already has
 * roomId, deviceId, action, status, notes, executedAt, triggeredByUserId.
 * Someone needs to add a controller that joins CommandLog + User and shapes
 * it into { date, time, description, picName, picRole } to match
 * RoomDeviceLogEntryDTO below. Until then this will 404 in dev.
 */
export function DeviceLogDrawer({ device, roomId, open, onClose }: DeviceLogDrawerProps) {
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<RoomDeviceLogEntryDTO[] | null>(null);

  useEffect(() => {
    if (!open || !device) return;
    setLogs(null);
    roomsApi
      .getDeviceLog(roomId, device.id)
      .then(setLogs)
      .catch(() => setLogs([]));
  }, [open, device, roomId]);

  if (!open || !device) return null;

  const filtered = (logs ?? []).filter((l) => l.picName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(255,255,255,0.1)]">
      <div className="flex h-full w-full max-w-[600px] flex-col gap-6 border-l border-slate-300 bg-white p-6 shadow-[0px_8px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-emerald-500">{device.tbDeviceId}</p>
            <p className="text-sm text-stone-500">{device.deviceEui}</p>
          </div>
          <button aria-label="Close" onClick={onClose}>
            <X className="size-4 text-slate-500" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-600">Log history</p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex h-8 w-[250px] items-center gap-1 rounded-md border border-slate-400 bg-white px-3 shadow-sm">
              <Search className="size-4 shrink-0 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by PIC"
                className="flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-500"
              />
            </div>
            <button
              aria-label="Export log"
              className="flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-400 bg-white"
            >
              <Download className="size-4 text-slate-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {logs === null ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No log entries found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>PIC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.time}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 py-1">
                          <span>{entry.picName}</span>
                          <span className="text-[10px] text-slate-500">{entry.picRole}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}