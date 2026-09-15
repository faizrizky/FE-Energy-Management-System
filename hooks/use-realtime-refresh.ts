'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { connectSocket } from '@/lib/socket';

/**
 * router.refresh() dengan debounce tiap ada event socket tertentu (buat data
 * yang dirender server component).
 *
 * Dipake di: dashboard/client.tsx → DashboardTabs, rooms/client.tsx (kartu
 *   statistik).
 */
export function useRealtimeRefresh(events: string[], debounceMs = 3000) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = connectSocket();

    const scheduleRefresh = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => router.refresh(), debounceMs);
    };

    events.forEach((event) => socket.on(event, scheduleRefresh));
    return () => {
      events.forEach((event) => socket.off(event, scheduleRefresh));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [events.join(','), debounceMs]);
}
