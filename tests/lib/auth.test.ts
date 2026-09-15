import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import {
  clearAuthCookies,
  getAccessToken,
  getRefreshTokenValue,
  getSession,
  RateLimitedError,
  ServerUnavailableError,
  setAuthCookies,
} from '@/lib/auth';
import { requestTokenRefresh } from '@/lib/auth-shared';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  cookieStore.get.mockReset();
  cookieStore.set.mockReset();
  cookieStore.delete.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const json = (status: number, body?: unknown, headers?: Record<string, string>) =>
  new Response(body === undefined ? null : typeof body === 'string' ? body : JSON.stringify(body), { status, headers });

describe('requestTokenRefresh (lib/auth-shared)', () => {
  test('[positive] sukses -> token baru; request memakai no-store & body refreshToken', async () => {
    fetchMock.mockResolvedValue(json(200, { data: { accessToken: 'a', refreshToken: 'b' } }));
    await expect(requestTokenRefresh('rt')).resolves.toEqual({ status: 'ok', tokens: { accessToken: 'a', refreshToken: 'b' } });
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'rt' }),
      cache: 'no-store',
    });
  });

  test.each([
    [{ 'retry-after': '30' }, 30],
    [{ 'ratelimit-reset': '45' }, 45],
    [{}, null],
    [{ 'retry-after': 'abc' }, null],
  ])('[negative] 429 dengan header %j -> rate_limited retryAfter %s', async (headers, seconds) => {
    fetchMock.mockResolvedValue(json(429, {}, headers));
    await expect(requestTokenRefresh('rt')).resolves.toEqual({ status: 'rate_limited', retryAfterSeconds: seconds });
  });

  test.each([401, 403])('[negative] %i -> invalid', async (status) => {
    fetchMock.mockResolvedValue(json(status, {}));
    await expect(requestTokenRefresh('rt')).resolves.toEqual({ status: 'invalid' });
  });

  test('[negative] 5xx, network error, JSON rusak, token tidak lengkap -> server_error', async () => {
    fetchMock.mockResolvedValueOnce(json(502, 'bad gateway'));
    expect(await requestTokenRefresh('rt')).toEqual({ status: 'server_error' });
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    expect(await requestTokenRefresh('rt')).toEqual({ status: 'server_error' });
    fetchMock.mockResolvedValueOnce(json(200, 'bukan json'));
    expect(await requestTokenRefresh('rt')).toEqual({ status: 'server_error' });
    fetchMock.mockResolvedValueOnce(json(200, { data: { accessToken: 'a' } }));
    expect(await requestTokenRefresh('rt')).toEqual({ status: 'server_error' });
  });
});

describe('cookie helpers (lib/auth)', () => {
  test('[positive] setAuthCookies: access token terbaca JS, refresh token httpOnly', async () => {
    await setAuthCookies({ accessToken: 'a', refreshToken: 'b' });
    expect(cookieStore.set).toHaveBeenCalledWith('ems_token', 'a', {
      httpOnly: false,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 3300,
    });
    expect(cookieStore.set).toHaveBeenCalledWith('ems_refresh_token', 'b', expect.objectContaining({ httpOnly: true, maxAge: 604800 }));
  });

  test('[positive] production -> cookie secure', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await setAuthCookies({ accessToken: 'a', refreshToken: 'b' });
    expect(cookieStore.set.mock.calls.every(([, , opts]) => opts.secure === true)).toBe(true);
  });

  test('[positive/negative] get & clear cookie', async () => {
    cookieStore.get.mockImplementation((name: string) => (name === 'ems_token' ? { value: 'tok' } : undefined));
    await expect(getAccessToken()).resolves.toBe('tok');
    await expect(getRefreshTokenValue()).resolves.toBeUndefined();
    await clearAuthCookies();
    expect(cookieStore.delete).toHaveBeenCalledWith('ems_token');
    expect(cookieStore.delete).toHaveBeenCalledWith('ems_refresh_token');
  });
});

describe('getSession', () => {
  const me = { data: { id: 'u1', fullName: 'Budi', email: 'b@test.com', role: 'Administrator', passwordHash: 'x' } };

  beforeEach(() => {
    cookieStore.get.mockReturnValue({ value: 'tok' });
  });

  test('[positive] token valid -> user dipetakan ke SessionUser', async () => {
    fetchMock.mockResolvedValue(json(200, me));
    await expect(getSession()).resolves.toEqual({ id: 'u1', name: 'Budi', email: 'b@test.com', role: 'Administrator' });
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/auth/me', { headers: { Authorization: 'Bearer tok' }, cache: 'no-store' });
  });

  test('[negative] tanpa cookie -> null tanpa request', async () => {
    cookieStore.get.mockReturnValue(undefined);
    await expect(getSession()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test.each([401, 403])('[negative] %i -> null (sesi tidak valid)', async (status) => {
    fetchMock.mockResolvedValue(json(status, {}));
    await expect(getSession()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('[positive] gagal sementara lalu berhasil di percobaan kedua', async () => {
    fetchMock.mockResolvedValueOnce(json(429, {})).mockResolvedValueOnce(json(200, me));
    await expect(getSession()).resolves.toMatchObject({ id: 'u1' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('[negative] 429 terus -> RateLimitedError', async () => {
    fetchMock.mockResolvedValue(json(429, {}));
    await expect(getSession()).rejects.toBeInstanceOf(RateLimitedError);
  });

  test('[negative] 500 terus / network error terus -> ServerUnavailableError', async () => {
    fetchMock.mockResolvedValue(json(500, {}));
    await expect(getSession()).rejects.toBeInstanceOf(ServerUnavailableError);
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(getSession()).rejects.toBeInstanceOf(ServerUnavailableError);
  });
});
