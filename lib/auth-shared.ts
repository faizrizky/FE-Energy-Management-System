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

export type RefreshResult =
  | { status: 'ok'; tokens: AuthTokens }
  | { status: 'rate_limited'; retryAfterSeconds: number | null }
  | { status: 'invalid' };

function getRetryAfterSeconds(res: Response): number | null {
  const retryAfter = res.headers.get('retry-after');
  if (retryAfter) return Number(retryAfter) || null;
  const reset = res.headers.get('ratelimit-reset');
  return reset ? Number(reset) || null : null;
}

export async function requestTokenRefresh(
  refreshToken: string
): Promise<RefreshResult> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (res.status === 429) {
      return {
        status: 'rate_limited',
        retryAfterSeconds: getRetryAfterSeconds(res),
      };
    }
    if (!res.ok) return { status: 'invalid' };

    const { data } = await res.json();
    if (!data?.accessToken || !data?.refreshToken) return { status: 'invalid' };
    return {
      status: 'ok',
      tokens: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
    };
  } catch {
    return { status: 'rate_limited', retryAfterSeconds: null };
  }
}
