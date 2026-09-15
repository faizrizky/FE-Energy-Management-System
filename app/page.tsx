import { redirect } from 'next/navigation';
import {
  getSession,
  RateLimitedError,
  ServerUnavailableError,
} from '@/lib/auth';

/**
 * Route "/": langsung redirect ke /dashboard kalo udah login, ke /login kalo
 * belom.
 *
 * Dipake di: Otomatis sama Next.js buat route /.
 */
export default async function RootPage() {
  let session = null;
  try {
    session = await getSession();
  } catch (err) {
    if (
      !(err instanceof RateLimitedError) &&
      !(err instanceof ServerUnavailableError)
    ) {
      throw err;
    }
  }
  redirect(session ? '/dashboard' : '/login');
}
