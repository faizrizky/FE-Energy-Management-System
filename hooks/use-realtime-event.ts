'use client';

import { useEffect, useRef } from 'react';
import { connectSocket } from '@/lib/socket';

/**
 * Subscribe satu event socket; handler yang dipanggil selalu versi terbaru,
 * dan listener dilepas pas unmount.
 *
 * Dipake di: Client halaman Device, Gateway, Report, Rooms, Room detail,
 *   Schedule, dan hooks/use-device-commands.ts.
 */
export function useRealtimeEvent<T = unknown>(
  event: string,
  handler: (payload: T) => void
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = connectSocket();
    const listener = (payload: T) => handlerRef.current(payload);

    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event]);
}
