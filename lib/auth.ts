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

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'PJ Gedung' | 'Komandan';
}

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

export async function clearAuthCookies() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshTokenValue(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
}

export async function getSession(): Promise<SessionUser | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const { data: user } = await res.json();
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}
