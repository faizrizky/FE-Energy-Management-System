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

/**
 * getSession versi aman: kalo backend lagi rate limit atau error dianggep
 * belom login, bukan ngelempar error.
 *
 * Dipake di: LoginPage (file ini).
 */
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

/**
 * Halaman /login: kalo udah login langsung dilempar ke redirectTo (cuma path
 * internal yang diawali '/'), kalo belom nampilin LoginClient.
 *
 * Dipake di: Otomatis sama Next.js buat route /login.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, params] = await Promise.all([safeGetSession(), searchParams]);

  const redirectTo = params.redirectTo?.startsWith('/')
    ? params.redirectTo
    : '/dashboard';

  if (session) redirect(redirectTo);

  return <LoginClient redirectTo={redirectTo} />;
}
