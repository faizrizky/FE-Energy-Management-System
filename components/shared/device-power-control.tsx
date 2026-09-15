'use client';

import { Loader2, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface DevicePowerControlProps {
  /** Posisi switch. Saat pending, isi dengan target perintah yang sedang dikejar. */
  checked: boolean;
  pending?: boolean;
  pendingLabel?: string;
  pendingTitle?: string | null;
  onToggle: () => void;
  onCancel?: () => void;
}

/**
 * Switch ON/OFF relay. Saat perintah masih menunggu meter, tampil spinner
 * (klik switch lagi = perintah baru menggantikan yang lama).
 */
export function DevicePowerControl({
  checked,
  pending = false,
  pendingLabel = 'Waiting for meter',
  pendingTitle,
  onToggle,
  onCancel,
}: DevicePowerControlProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        onCheckedChange={onToggle}
        aria-busy={pending}
        className={cn(pending && 'opacity-60')}
      />
      {pending && (
        <span
          className="flex items-center gap-1 whitespace-nowrap text-xs text-slate-500"
          title={pendingTitle ?? undefined}
        >
          <Loader2 className="size-3.5 animate-spin" />
          {pendingLabel}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel power command"
              className="flex size-5 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            >
              <X className="size-3.5" />
            </button>
          )}
        </span>
      )}
    </div>
  );
}
