'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { DeviceResyncStateDTO } from '@/feat/device/dto';

/**
 * Sisa detik menuju waktu tertentu (dibuletin ke atas). null kalo waktunya
 * nggak dikasih.
 *
 * Dipake di: useResyncCountdown (file ini).
 */
function secondsUntil(target?: string | null) {
  if (!target) return null;
  const diffMs = new Date(target).getTime() - Date.now();
  return Number.isNaN(diffMs) ? null : Math.max(0, Math.ceil(diffMs / 1000));
}

/**
 * Device dianggap offline kalau server bilang offline, atau batas onlineUntil
 * udah kelewat (dicek ulang tiap 15 detik biar nggak telat).
 *
 * Dipake di: DevicePowerControl (file ini).
 */
function useIsOffline(offline: boolean, onlineUntil?: string | null) {
  const passed = (target?: string | null) =>
    Boolean(target) && new Date(target as string).getTime() <= Date.now();

  const [expired, setExpired] = useState(() => passed(onlineUntil));

  useEffect(() => {
    setExpired(passed(onlineUntil));
    if (!onlineUntil) return;

    const timer = setInterval(() => setExpired(passed(onlineUntil)), 15000);
    return () => clearInterval(timer);
  }, [onlineUntil]);

  return offline || expired;
}

/**
 * Hitungan mundur yang jalan tiap detik sampai waktunya lewat.
 *
 * Dipake di: DevicePowerControl (file ini).
 */
function useResyncCountdown(target?: string | null) {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(target));

  useEffect(() => {
    setSecondsLeft(secondsUntil(target));
    if (!target) return;

    const timer = setInterval(() => setSecondsLeft(secondsUntil(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);

  return secondsLeft;
}

interface DevicePowerControlProps {
  checked: boolean;
  pending?: boolean;
  pendingLabel?: string;
  pendingTitle?: string | null;
  uncertain?: boolean;
  resync?: DeviceResyncStateDTO | null;
  offline?: boolean;
  onlineUntil?: string | null;
  onToggle: () => void;
}

/**
 * Switch ON/OFF relay. Switch dikunci selama perintah masih nunggu meter,
 * selama status relai belom pasti, sama pas device-nya offline. Pas offline
 * switch-nya ditaruh di posisi Off (bukan hijau), soalnya status relai yang
 * sebenernya nggak bisa dipercaya lagi.
 *
 * Dipake di: column/device.tsx, column/room-devices.tsx, column/rooms.tsx,
 *   rooms/_partials/room-card.tsx.
 */
export function DevicePowerControl({
  checked,
  pending = false,
  pendingLabel = 'Waiting for meter',
  pendingTitle,
  uncertain = false,
  resync,
  offline = false,
  onlineUntil,
  onToggle,
}: DevicePowerControlProps) {
  const isOffline = useIsOffline(offline, onlineUntil);
  const secondsLeft = useResyncCountdown(resync?.nextRetryAt);
  const resyncLabel = resync
    ? secondsLeft === null || secondsLeft === 0
      ? 'Resync running'
      : `Resync in ${secondsLeft}s`
    : null;
  const attemptLabel = resync
    ? resync.maxAttempts
      ? `(${resync.attempt}/${resync.maxAttempts})`
      : `(attempt ${resync.attempt})`
    : null;

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isOffline ? false : checked}
        onCheckedChange={onToggle}
        disabled={pending || uncertain || isOffline}
        aria-busy={pending}
        title={
          isOffline
            ? 'Device offline: no report from the meter, commands would not reach it.'
            : undefined
        }
        className={cn(
          (pending || uncertain || isOffline) && 'cursor-not-allowed opacity-60'
        )}
      />
      {!isOffline && !pending && uncertain && (
        <span
          className="flex flex-col whitespace-nowrap text-xs text-amber-600"
          title={
            resync
              ? `Waiting for the meter to report back (attempt ${resync.attempt} of ${resync.maxAttempts}). The switch unlocks once telemetry confirms the relay state.`
              : 'Command was cancelled or failed after it had been sent to the meter. The switch stays locked until the next telemetry confirms the relay state.'
          }
        >
          Status unconfirmed
          {resyncLabel && (
            <span className="text-[11px] text-slate-500">
              {resyncLabel} {attemptLabel}
            </span>
          )}
        </span>
      )}
      {!isOffline && pending && (
        <span
          className="flex flex-col whitespace-nowrap text-xs text-slate-500"
          title={pendingTitle ?? undefined}
        >
          <span className="flex items-center gap-1">
            <Loader2 className="size-3.5 animate-spin" />
            {pendingLabel}
          </span>
          {resyncLabel && (
            <span className="text-[11px] text-slate-400">
              {resyncLabel} {attemptLabel}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
