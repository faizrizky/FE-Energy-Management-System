import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shared/app-shell';
import { ErrorState } from '@/components/shared/error-state';
import {
  getSession,
  RateLimitedError,
  ServerUnavailableError,
} from '@/lib/auth';

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  let session;
  try {
    session = await getSession();
  } catch (err) {
    if (
      err instanceof RateLimitedError ||
      err instanceof ServerUnavailableError
    ) {
      return (
        <ErrorState
          title={
            err instanceof RateLimitedError
              ? 'Server Sedang Sibuk'
              : 'Server Sedang Bermasalah'
          }
          description="Sesi kamu masih aktif. Coba muat ulang halaman ini dalam beberapa detik."
          actionLabel="Muat ulang"
          actionHref="/dashboard"
        />
      );
    }
    throw err;
  }

  if (!session) redirect('/login');

  return <AppShell>{children}</AppShell>;
}
