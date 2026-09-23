'use client';

import { X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { PowerPill } from '@/column/schedule';
import type {
  ScheduleDetailDTO,
  ScheduleExecutionStatus,
} from '@/feat/schedule/dto';
import { formatLongDate, formatScheduleDate } from '@/feat/schedule/time';

interface ScheduleDetailModalProps {
  open: boolean;
  schedule: ScheduleDetailDTO | null;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
}

const EXECUTION_LABEL_COLOR: Record<ScheduleExecutionStatus, string> = {
  executed: 'text-emerald-500',
  partial: 'text-amber-600',
  pending: 'text-amber-600',
  skipped: 'text-slate-500',
  failed: 'text-red-500',
};

/**
 * Modal detail schedule: nama, status, tanggal dibuat/diubah, deskripsi, sama
 * riwayat eksekusi terbaru. Info room/jam/repeat nggak diulang di sini karena
 * udah keliatan di baris tabelnya.
 *
 * Dipake di: schedule/client.tsx.
 */
export function ScheduleDetailModal({
  open,
  schedule,
  onOpenChange,
  onClose,
}: ScheduleDetailModalProps) {
  if (!schedule) return null;

  // updatedAt di-set bareng createdAt pas dibuat; selisih < 1 detik berarti
  // belum pernah diubah.
  const neverUpdated =
    Math.abs(
      new Date(schedule.updatedAt).getTime() -
        new Date(schedule.createdAt).getTime()
    ) < 1000;

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      panelClassName="max-w-[450px] border-neutral-300 shadow-[0px_8px_12px_rgba(0,0,0,0.05)]"
    >
      <div className="flex flex-col gap-4 overflow-y-auto p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold leading-7 text-emerald-500">
              {schedule.name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-md p-0.5 text-red-500 hover:bg-red-50"
            >
              <X className="size-4" />
            </button>
          </div>
          <StatusBadge status={schedule.status} />
        </div>

        <div className="h-px bg-slate-200" />

        <section className="flex flex-col gap-4 py-2">
          <p className="text-xs text-slate-600">Basic information</p>
          <div className="flex flex-col gap-2 rounded-xl border border-neutral-300 p-4 text-sm shadow-[0px_8px_12px_rgba(0,0,0,0.05)]">
            <InfoRow
              label="Created at"
              value={formatLongDate(schedule.createdAt)}
            />
            <InfoRow
              label="Last updated"
              value={neverUpdated ? '-' : formatLongDate(schedule.updatedAt)}
            />
            {schedule.description && (
              <p className="text-slate-950">{schedule.description}</p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4 py-2">
          <p className="text-xs text-slate-600">Recent Activity Log</p>
          {schedule.recentActivity.length === 0 ? (
            <div className="rounded-xl border border-slate-300 p-4 text-sm text-slate-500">
              This schedule has not run yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {schedule.recentActivity.map((entry) => (
                <div
                  key={entry.key}
                  className="flex min-h-[68px] items-center justify-between gap-4 rounded-xl border border-slate-300 p-4 shadow-[0px_8px_12px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex flex-col gap-1 text-sm">
                    <p
                      className={[
                        'font-medium',
                        EXECUTION_LABEL_COLOR[entry.status],
                      ].join(' ')}
                    >
                      {entry.label}
                    </p>
                    <p className="text-slate-950">
                      {formatScheduleDate(entry.date)} · {entry.time}
                    </p>
                  </div>
                  <PowerPill action={entry.action} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}

/**
 * Baris label–nilai buat nampilin detail data.
 *
 * Dipake di: ScheduleDetailModal (file ini).
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-medium text-neutral-500">{label}</span>
      <span className="text-right text-slate-950">{value}</span>
    </div>
  );
}

/**
 * Badge status schedule: hijau dengan titik menyala kalo active, abu-abu
 * kalo selain itu.
 *
 * Dipake di: ScheduleDetailModal (file ini).
 */
function StatusBadge({ status }: { status: string }) {
  const active = status === 'active';
  return (
    <span
      className={[
        'inline-flex h-7 w-fit items-center gap-2 rounded-full border px-2.5 text-xs font-medium',
        active
          ? 'border-green-500 text-green-500'
          : 'border-slate-400 text-slate-500',
      ].join(' ')}
    >
      <span
        className={[
          'size-2 rounded',
          active
            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
            : 'bg-slate-400',
        ].join(' ')}
      />
      {status.toUpperCase()}
    </span>
  );
}
