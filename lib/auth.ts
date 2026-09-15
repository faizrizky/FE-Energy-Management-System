import { cookies } from 'next/headers';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  type AuthTokens,
} from './auth-shared';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

const MAX_ME_ATTEMPTS = 2;
const ME_RETRY_DELAY_MS = 300;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'PJ Gedung' | 'Komandan';
}

export class RateLimitedError extends Error {
  constructor() {
    super('Sesi sedang dibatasi rate limit, coba lagi sebentar');
    this.name = 'RateLimitedError';
  }
}

export class ServerUnavailableError extends Error {
  constructor() {
    super('Server sedang bermasalah, coba lagi sebentar');
    this.name = 'ServerUnavailableError';
  }
}

/**
 * Simpen cookie token: access token (bisa dibaca JS, 55 menit) & refresh token
 * (httpOnly, 7 hari); secure di production.
 *
 * Dipake di: feat/auth/actions.ts → loginAction,
 *   app/api/auth/refresh/route.ts.
 */
export async function setAuthCookies({
  accessToken,
  refreshToken,
}: AuthTokens) {
  const store = await cookies();
  const isProd = process.env.NODE_ENV === 'production';

  store.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  store.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

/**
 * Hapus cookie access & refresh token.
 *
 * Dipake di: feat/auth/actions.ts → logoutAction,
 *   app/api/auth/refresh/route.ts (kalo refresh ditolak).
 */
export async function clearAuthCookies() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

/**
 * Baca cookie access token di server.
 *
 * Dipake di: getSession (file ini), lib/http.ts → http.
 */
export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
}

/**
 * Baca cookie refresh token di server.
 *
 * Dipake di: feat/auth/actions.ts → logoutAction,
 *   app/api/auth/refresh/route.ts.
 */
export async function getRefreshTokenValue(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
}

/**
 * GET /auth/me pake access token (tanpa cache).
 *
 * Dipake di: getSession (file ini).
 */
async function fetchMe(token: string) {
  return fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
}

/**
 * Ambil user yang login dari server dengan retry 2x. Balikin null kalo belom
 * login atau token ditolak; lempar RateLimitedError / ServerUnavailableError
 * kalo backend lagi bermasalah.
 *
 * Dipake di: app/(protected)/layout.tsx, semua page.tsx terproteksi,
 *   app/login/page.tsx, app/page.tsx.
 */
export async function getSession(): Promise<SessionUser | null> {
  const token = await getAccessToken();
  if (!token) return null;

  for (let attempt = 1; attempt <= MAX_ME_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetchMe(token);
    } catch {
      if (attempt === MAX_ME_ATTEMPTS) throw new ServerUnavailableError();
      await new Promise((r) => setTimeout(r, ME_RETRY_DELAY_MS));
      continue;
    }

    if (res.status === 429) {
      if (attempt === MAX_ME_ATTEMPTS) throw new RateLimitedError();
      await new Promise((r) => setTimeout(r, ME_RETRY_DELAY_MS));
      continue;
    }

    if (res.status === 401 || res.status === 403) return null;

    if (!res.ok) {
      if (attempt === MAX_ME_ATTEMPTS) throw new ServerUnavailableError();
      await new Promise((r) => setTimeout(r, ME_RETRY_DELAY_MS));
      continue;
    }

    const { data: user } = await res.json();
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  return null;
}
