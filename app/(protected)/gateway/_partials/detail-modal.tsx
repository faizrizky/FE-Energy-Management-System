'use client';

import { X } from 'lucide-react';
import type { GatewayDetailDTO } from '@/feat/gateway/dto';

interface GatewayDetailModalProps {
  gateway: GatewayDetailDTO | null;
  loading: boolean;
  onClose: () => void;
}

export function GatewayDetailModal({
  gateway,
  loading,
  onClose,
}: GatewayDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.5)] p-4 backdrop-blur-[5px]">
      <div className="flex w-full max-w-[450px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0px_8px_12px_rgba(0,0,0,0.15)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold leading-7 text-emerald-500">
              {loading ? 'Loading...' : (gateway?.name ?? 'Gateway')}
            </h2>
            <p className="text-sm font-medium leading-5 text-neutral-500">
              {loading ? '-' : (gateway?.eui ?? '-')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-red-500 transition hover:bg-red-50"
            aria-label="Close gateway detail"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <p className="text-xs font-normal leading-[18px] text-slate-600">
            Basic information
          </p>

          {loading ? (
            <div className="rounded-xl border border-neutral-300 bg-white p-4 shadow-[0_8px_12px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col gap-3">
                <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-5 w-4/5 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ) : gateway ? (
            <div className="flex w-full flex-col gap-2 rounded-xl border border-neutral-300 bg-white p-4 text-sm leading-5 shadow-[0_8px_12px_rgba(0,0,0,0.05)]">
              <InfoRow
                label="Installed by"
                value={gateway.installedBy?.fullName ?? '-'}
              />
              <InfoRow
                label="Created by"
                value={gateway.installedBy?.fullName ?? '-'}
              />
              <InfoRow
                label="Updated by"
                value={gateway.installedBy?.fullName ?? '-'}
              />
              <p className="pt-1 font-normal text-slate-950">
                {gateway.description || '-'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                Failed to load gateway detail.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <p className="shrink-0 font-medium text-neutral-500">{label}</p>
      <p className="text-right font-normal text-slate-950">{value}</p>
    </div>
  );
}
