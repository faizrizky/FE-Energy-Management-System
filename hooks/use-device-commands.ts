'use client';

import { useCallback, useRef } from 'react';
import { toast } from '@/lib/toast-store';
import { useRealtimeEvent } from '@/hooks/use-realtime-event';
import type {
  DeviceCommandEventDTO,
  DevicePendingCommandDTO,
  DevicePowerStatus,
} from '@/feat/device/dto';

function notify(event: DeviceCommandEventDTO) {
  const label = event.deviceName ?? 'Device';
  const action = event.action.toUpperCase();

  if (event.status === 'success') {
    toast.success(`${label} turned ${action}`, {
      description: event.notes ?? undefined,
    });
  } else if (event.status === 'failed') {
    toast.error(`Failed to turn ${action} ${label}`, {
      description: event.notes ?? undefined,
    });
  }
}

/**
 * Terapkan event `device:command` ke satu baris device. `applySuccess` dipakai
 * karena tiap list menyimpan status power dengan field yang berbeda.
 */
export function reduceCommandEvent<
  T extends { pendingCommand?: DevicePendingCommandDTO | null },
>(
  item: T,
  event: DeviceCommandEventDTO,
  applySuccess: (item: T, action: DevicePowerStatus) => T
): T {
  if (event.status === 'pending') {
    const current = item.pendingCommand;
    if (
      current &&
      current.id !== event.commandId &&
      current.requestedAt > event.requestedAt
    ) {
      return item;
    }
    return {
      ...item,
      pendingCommand: {
        id: event.commandId,
        action: event.action,
        notes: event.notes,
        requestedAt: event.requestedAt,
        deadline: event.deadline,
      },
    };
  }

  const next =
    item.pendingCommand?.id === event.commandId
      ? { ...item, pendingCommand: null }
      : item;
  return event.status === 'success' ? applySuccess(next, event.action) : next;
}

/**
 * Dengarkan hasil perintah relay. Toast sukses/gagal hanya untuk perintah
 * yang dikirim dari tab ini (didaftarkan lewat `track`).
 */
export function useDeviceCommands(
  onEvent: (event: DeviceCommandEventDTO) => void
) {
  const mine = useRef(new Set<string>());
  const finals = useRef(new Map<string, DeviceCommandEventDTO>());
  const notified = useRef(new Set<string>());

  const notifyOnce = (event: DeviceCommandEventDTO) => {
    if (notified.current.has(event.commandId)) return;
    notified.current.add(event.commandId);
    notify(event);
  };

  useRealtimeEvent<DeviceCommandEventDTO>('device:command', (event) => {
    if (finals.current.has(event.commandId)) return;
    if (event.status !== 'pending') {
      finals.current.set(event.commandId, event);
      if (mine.current.has(event.commandId)) notifyOnce(event);
    }
    onEvent(event);
  });

  /**
   * Daftarkan respons API. Kalau hasil akhirnya sudah keburu datang lewat
   * socket, event final itu yang dikembalikan supaya UI tidak nyangkut pending.
   */
  const track = useCallback((result: DeviceCommandEventDTO) => {
    mine.current.add(result.commandId);
    const final =
      finals.current.get(result.commandId) ??
      (result.status !== 'pending' ? result : null);
    if (!final) return result;

    finals.current.set(result.commandId, final);
    notifyOnce(final);
    return final;
  }, []);

  return { track };
}
