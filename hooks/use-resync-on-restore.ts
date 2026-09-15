'use client';

import { useEffect, useRef } from 'react';
import { connectSocket } from '@/lib/socket';

const consumedInitialData = new WeakMap<object, number>();
const REMOUNT_GRACE_MS = 1000;

export function useResyncOnRestore(resync: () => void, initialData: object) {
  const resyncRef = useRef(resync);
  resyncRef.current = resync;

  useEffect(() => {
    const consumedAt = consumedInitialData.get(initialData);
    if (consumedAt === undefined) {
      consumedInitialData.set(initialData, Date.now());
    } else if (Date.now() - consumedAt > REMOUNT_GRACE_MS) {
      resyncRef.current();
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) resyncRef.current();
    };
    window.addEventListener('pageshow', onPageShow);

    const manager = connectSocket().io;
    const onReconnect = () => resyncRef.current();
    manager.on('reconnect', onReconnect);

    return () => {
      window.removeEventListener('pageshow', onPageShow);
      manager.off('reconnect', onReconnect);
    };
  }, [initialData]);
}
