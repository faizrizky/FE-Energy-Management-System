'use client';

import { useState } from 'react';
import { X, Download, Search } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import type { RoomDeviceDTO, RoomDeviceLogEntryDTO } from '@/feat/rooms/dto';

interface DeviceLogModalProps {
  device: RoomDeviceDTO | null;
  logs: RoomDeviceLogEntryDTO[] | null;
  loading: boolean;
  open: boolean;
  onClose: (open: boolean) => void;
}

export function DeviceLogModal({
  device,
  logs,
  loading,
  open,
  onClose,
}: DeviceLogModalProps) {
  const [search, setSearch] = useState('');

  if (!device) return null;

  const filtered = (logs ?? []).filter((l) =>
    l.picName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      open={open}
      onClose={() => onClose(false)}
      panelClassName="max-w-[600px] h-[min(600px,85vh)] p-6 gap-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-emerald-500">
            {device.tbDeviceId}
          </p>
          <p className="text-sm text-stone-500">{device.deviceEui}</p>
        </div>
        <button aria-label="Close" onClick={() => onClose(false)}>
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
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No log entries found.
            </p>
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
                        <span className="text-[10px] text-slate-500">
                          {entry.picRole}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </Modal>
  );
}
