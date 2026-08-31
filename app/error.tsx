'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/shared/error-state';

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
