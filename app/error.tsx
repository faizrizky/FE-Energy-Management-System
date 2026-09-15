'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/shared/error-state';

/**
 * Halaman error global (error boundary): log error ke console terus kasih
 * tombol buat nyoba render ulang.
 *
 * Dipake di: Otomatis sama Next.js kalo ada error pas render halaman.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="System Experiencing Issues"
      description="The system is currently experiencing technical difficulties. Please try again in a few moments."
      actionLabel="Refresh page"
      onAction={reset}
    />
  );
}
