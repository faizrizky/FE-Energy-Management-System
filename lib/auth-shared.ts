export const ACCESS_TOKEN_COOKIE = 'ems_token';
export const REFRESH_TOKEN_COOKIE = 'ems_refresh_token';

export const ACCESS_TOKEN_MAX_AGE = 55 * 60;
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function requestTokenRefresh(
  refreshToken: string
): Promise<AuthTokens | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const { data } = await res.json();
    if (!data?.accessToken || !data?.refreshToken) return null;
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  } catch {
    return null;
  }
}
