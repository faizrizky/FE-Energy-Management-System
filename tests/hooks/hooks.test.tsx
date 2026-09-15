import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

type Listener = (payload?: unknown) => void;

const fakeSocket = vi.hoisted(() => {
  const listeners = new Map<string, Set<(payload?: unknown) => void>>();
  const managerListeners = new Map<string, Set<(payload?: unknown) => void>>();
  const add = (map: typeof listeners) => (event: string, fn: (payload?: unknown) => void) => {
    if (!map.has(event)) map.set(event, new Set());
    map.get(event)!.add(fn);
  };
  const remove = (map: typeof listeners) => (event: string, fn: (payload?: unknown) => void) => {
    map.get(event)?.delete(fn);
  };
  return {
    listeners,
    managerListeners,
    socket: {
      on: vi.fn(add(listeners)),
      off: vi.fn(remove(listeners)),
      io: { on: vi.fn(add(managerListeners)), off: vi.fn(remove(managerListeners)) },
    },
    emit(event: string, payload?: unknown) {
      listeners.get(event)?.forEach((fn) => fn(payload));
    },
    emitManager(event: string) {
      managerListeners.get(event)?.forEach((fn) => fn());
    },
  };
});

const router = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock('@/lib/socket', () => ({ connectSocket: () => fakeSocket.socket }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/lib/toast-store', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from '@/lib/toast-store';
import { useRealtimeEvent } from '@/hooks/use-realtime-event';
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh';
import { reduceCommandEvent, useDeviceCommands } from '@/hooks/use-device-commands';
import { useResyncOnRestore } from '@/hooks/use-resync-on-restore';
import type { DeviceCommandEventDTO, DevicePendingCommandDTO } from '@/feat/device/dto';

beforeEach(() => {
  fakeSocket.listeners.clear();
  fakeSocket.managerListeners.clear();
  vi.clearAllMocks();
});

const listenerCount = (event: string) => fakeSocket.listeners.get(event)?.size ?? 0;

function commandEvent(overrides: Partial<DeviceCommandEventDTO> = {}): DeviceCommandEventDTO {
  return {
    commandId: 'c1',
    deviceId: 'd1',
    deviceName: 'KwH Meter',
    roomId: 'r1',
    action: 'on',
    status: 'pending',
    notes: null,
    requestedAt: '2026-09-15T10:00:00.000Z',
    deadline: '2026-09-15T10:30:00.000Z',
    timestamp: '2026-09-15T10:00:00.000Z',
    ...overrides,
  };
}

describe('useRealtimeEvent', () => {
  test('[positive] handler terbaru dipanggil tanpa re-subscribe', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ fn }) => useRealtimeEvent('device:status', fn), { initialProps: { fn: first } });
    rerender({ fn: second });
    fakeSocket.emit('device:status', { id: 1 });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ id: 1 });
    expect(fakeSocket.socket.on).toHaveBeenCalledTimes(1);
  });

  test('[negative] setelah unmount listener dilepas; event lain diabaikan', () => {
    const fn = vi.fn();
    const { unmount } = renderHook(() => useRealtimeEvent('device:status', fn));
    fakeSocket.emit('room:power', {});
    expect(fn).not.toHaveBeenCalled();
    unmount();
    expect(listenerCount('device:status')).toBe(0);
  });
});

describe('useRealtimeRefresh', () => {
  test('[positive] banyak event beruntun -> router.refresh sekali setelah debounce', () => {
    vi.useFakeTimers();
    renderHook(() => useRealtimeRefresh(['device:status', 'room:power'], 1000));
    fakeSocket.emit('device:status');
    vi.advanceTimersByTime(500);
    fakeSocket.emit('room:power');
    vi.advanceTimersByTime(999);
    expect(router.refresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(router.refresh).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  test('[negative] unmount sebelum debounce habis -> tidak refresh & listener dilepas', () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useRealtimeRefresh(['device:status']));
    fakeSocket.emit('device:status');
    unmount();
    vi.advanceTimersByTime(5000);
    expect(router.refresh).not.toHaveBeenCalled();
    expect(listenerCount('device:status')).toBe(0);
    vi.useRealTimers();
  });
});

describe('reduceCommandEvent', () => {
  type Row = { id: string; status: 'on' | 'off'; pendingCommand?: DevicePendingCommandDTO | null };
  const applySuccess = (row: Row, action: 'on' | 'off'): Row => ({ ...row, status: action });
  const row: Row = { id: 'd1', status: 'off', pendingCommand: null };

  test('[positive] pending -> pendingCommand terisi', () => {
    expect(reduceCommandEvent(row, commandEvent(), applySuccess).pendingCommand).toEqual({
      id: 'c1',
      action: 'on',
      notes: null,
      requestedAt: '2026-09-15T10:00:00.000Z',
      deadline: '2026-09-15T10:30:00.000Z',
    });
  });

  test('[positive] success -> pending dibersihkan & status diterapkan', () => {
    const pending = reduceCommandEvent(row, commandEvent(), applySuccess);
    expect(reduceCommandEvent(pending, commandEvent({ status: 'success' }), applySuccess)).toEqual({ id: 'd1', status: 'on', pendingCommand: null });
  });

  test.each(['failed', 'cancelled'] as const)('[negative] %s -> pending dibersihkan, status tetap', (status) => {
    const pending = reduceCommandEvent(row, commandEvent(), applySuccess);
    expect(reduceCommandEvent(pending, commandEvent({ status }), applySuccess)).toEqual({ id: 'd1', status: 'off', pendingCommand: null });
  });

  test('[negative] event final untuk command lama tidak menghapus pending command baru', () => {
    const newer = reduceCommandEvent(row, commandEvent({ commandId: 'c2', action: 'off', requestedAt: '2026-09-15T10:05:00.000Z' }), applySuccess);
    const result = reduceCommandEvent(newer, commandEvent({ commandId: 'c1', status: 'cancelled' }), applySuccess);
    expect(result.pendingCommand?.id).toBe('c2');
  });

  test('[negative] event pending lama yang datang terlambat tidak menimpa command yang lebih baru', () => {
    const newer = reduceCommandEvent(row, commandEvent({ commandId: 'c2', requestedAt: '2026-09-15T10:05:00.000Z' }), applySuccess);
    expect(reduceCommandEvent(newer, commandEvent({ commandId: 'c1' }), applySuccess)).toBe(newer);
  });

  test('[positive] success untuk command yang tidak tercatat pending tetap memperbarui status', () => {
    expect(reduceCommandEvent(row, commandEvent({ status: 'success', action: 'on' }), applySuccess).status).toBe('on');
  });
});

describe('useDeviceCommands', () => {
  test('[positive] event diteruskan ke onEvent; toast hanya untuk perintah milik tab ini', () => {
    const onEvent = vi.fn();
    const { result } = renderHook(() => useDeviceCommands(onEvent));

    act(() => {
      result.current.track(commandEvent({ commandId: 'mine' }));
    });
    act(() => {
      fakeSocket.emit('device:command', commandEvent({ commandId: 'mine', status: 'success' }));
      fakeSocket.emit('device:command', commandEvent({ commandId: 'other', status: 'failed' }));
    });

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenCalledWith('KwH Meter turned ON', { description: undefined });
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('[negative] event final duplikat & pending setelah final diabaikan', () => {
    const onEvent = vi.fn();
    const { result } = renderHook(() => useDeviceCommands(onEvent));
    act(() => {
      result.current.track(commandEvent());
      fakeSocket.emit('device:command', commandEvent({ status: 'failed', notes: 'Meter tidak merespons' }));
      fakeSocket.emit('device:command', commandEvent({ status: 'failed' }));
      fakeSocket.emit('device:command', commandEvent({ status: 'pending' }));
    });
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Failed to turn ON KwH Meter', { description: 'Meter tidak merespons' });
  });

  test('[positive] hasil final datang lewat socket SEBELUM respons API -> track mengembalikan event final & toast sekali', () => {
    const { result } = renderHook(() => useDeviceCommands(vi.fn()));
    act(() => {
      fakeSocket.emit('device:command', commandEvent({ status: 'success' }));
    });
    let tracked!: DeviceCommandEventDTO;
    act(() => {
      tracked = result.current.track(commandEvent({ status: 'pending' }));
    });
    expect(tracked.status).toBe('success');
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  test('[negative] respons API langsung failed -> toast error sekali walau socket juga mengirim failed', () => {
    const { result } = renderHook(() => useDeviceCommands(vi.fn()));
    act(() => {
      result.current.track(commandEvent({ status: 'failed', deviceName: null }));
      fakeSocket.emit('device:command', commandEvent({ status: 'failed' }));
    });
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Failed to turn ON Device', { description: undefined });
  });

  test('[negative] cancelled tidak memunculkan toast', () => {
    const { result } = renderHook(() => useDeviceCommands(vi.fn()));
    act(() => {
      result.current.track(commandEvent({ status: 'cancelled' }));
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('useResyncOnRestore', () => {
  test('[negative] mount pertama tidak resync', () => {
    const resync = vi.fn();
    renderHook(() => useResyncOnRestore(resync, {}));
    expect(resync).not.toHaveBeenCalled();
  });

  test('[positive] mount ulang dengan props server yang sama (> 1 dtk) -> resync (router cache back/forward)', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const initialData = { data: [] };
    const resync = vi.fn();
    const first = renderHook(() => useResyncOnRestore(resync, initialData));
    first.unmount();
    vi.setSystemTime(Date.now() + 1500);
    renderHook(() => useResyncOnRestore(resync, initialData));
    expect(resync).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  test('[negative] mount ulang instan (StrictMode dev) -> tidak resync', () => {
    const initialData = { data: [] };
    const resync = vi.fn();
    renderHook(() => useResyncOnRestore(resync, initialData)).unmount();
    renderHook(() => useResyncOnRestore(resync, initialData));
    expect(resync).not.toHaveBeenCalled();
  });

  test('[positive/negative] pageshow dari bfcache -> resync; pageshow biasa -> tidak', () => {
    const resync = vi.fn();
    renderHook(() => useResyncOnRestore(resync, {}));
    window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: false }));
    expect(resync).not.toHaveBeenCalled();
    window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    expect(resync).toHaveBeenCalledTimes(1);
  });

  test('[positive] socket reconnect -> resync; setelah unmount listener dilepas', () => {
    const resync = vi.fn();
    const { unmount } = renderHook(() => useResyncOnRestore(resync, {}));
    fakeSocket.emitManager('reconnect');
    expect(resync).toHaveBeenCalledTimes(1);
    unmount();
    fakeSocket.emitManager('reconnect');
    window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    expect(resync).toHaveBeenCalledTimes(1);
  });
});
