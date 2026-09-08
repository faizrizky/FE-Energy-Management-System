import { redirect } from 'next/navigation';
import {
  getSession,
  RateLimitedError,
  ServerUnavailableError,
} from '@/lib/auth';
import { LoginClient } from './client';

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

async function safeGetSession() {
  try {
    return await getSession();
  } catch (err) {
    if (
      err instanceof RateLimitedError ||
      err instanceof ServerUnavailableError
    ) {
      return null;
    }
    throw err;
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, params] = await Promise.all([safeGetSession(), searchParams]);

  const redirectTo = params.redirectTo?.startsWith('/')
    ? params.redirectTo
    : '/dashboard';

  if (session) redirect(redirectTo);

  return <LoginClient redirectTo={redirectTo} />;
}
