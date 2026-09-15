// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/auth-shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth-shared')>()),
  requestTokenRefresh: vi.fn(),
}));

import { requestTokenRefresh } from '@/lib/auth-shared';
import { config, middleware } from '@/middleware';

function jwtWithExp(secondsFromNow: number) {
  const payload = Buffer.from(JSON.stringify({ id: 'u1', exp: Math.floor(Date.now() / 1000) + secondsFromNow })).toString('base64url');
  return `header.${payload}.signature`;
}

function makeRequest(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  return new NextRequest(new URL(path, 'http://localhost:3000'), { headers: cookie ? { cookie } : {} });
}

const isNext = (res: Response) => res.headers.get('x-middleware-next') === '1';
const setCookie = (res: Response) => res.headers.getSetCookie().join('\n');

beforeEach(() => {
  vi.mocked(requestTokenRefresh).mockReset();
});

describe('middleware', () => {
  test('[positive] halaman publik tidak dicek sama sekali', async () => {
    for (const path of ['/login', '/', '/roomsx', '/api/auth/refresh']) {
      const res = await middleware(makeRequest(path));
      expect(isNext(res)).toBe(true);
    }
    expect(requestTokenRefresh).not.toHaveBeenCalled();
  });

  test('[positive] access token masih lama berlaku -> lanjut tanpa refresh', async () => {
    const res = await middleware(makeRequest('/rooms/detail/1', { ems_token: jwtWithExp(600) }));
    expect(isNext(res)).toBe(true);
    expect(requestTokenRefresh).not.toHaveBeenCalled();
  });

  test('[negative] tanpa access & refresh token -> redirect login dengan redirectTo', async () => {
    const res = await middleware(makeRequest('/device'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?redirectTo=%2Fdevice');
  });

  test('[positive] token hampir habis (<60 dtk) -> refresh, cookie baru di response & request', async () => {
    vi.mocked(requestTokenRefresh).mockResolvedValue({ status: 'ok', tokens: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
    const res = await middleware(makeRequest('/dashboard', { ems_token: jwtWithExp(30), ems_refresh_token: 'rt' }));

    expect(requestTokenRefresh).toHaveBeenCalledWith('rt');
    expect(isNext(res)).toBe(true);
    const cookies = setCookie(res);
    expect(cookies).toContain('ems_token=new-access');
    expect(cookies).toMatch(/ems_refresh_token=new-refresh;.*HttpOnly/i);
    expect(res.headers.get('x-middleware-request-cookie') ?? res.headers.get('x-middleware-override-headers')).toBeTruthy();
  });

  test('[negative] token rusak / tanpa exp dianggap kadaluarsa', async () => {
    vi.mocked(requestTokenRefresh).mockResolvedValue({ status: 'invalid' });
    await middleware(makeRequest('/user', { ems_token: 'bukan-jwt', ems_refresh_token: 'rt' }));
    expect(requestTokenRefresh).toHaveBeenCalledTimes(1);
  });

  test('[negative] refresh invalid -> redirect login & kedua cookie dihapus', async () => {
    vi.mocked(requestTokenRefresh).mockResolvedValue({ status: 'invalid' });
    const res = await middleware(makeRequest('/schedule', { ems_refresh_token: 'revoked' }));
    expect(res.status).toBe(307);
    const cookies = setCookie(res);
    expect(cookies).toMatch(/ems_token=;/);
    expect(cookies).toMatch(/ems_refresh_token=;/);
  });

  test('[negative] refresh kena rate limit -> tetap lanjut dengan header retry-after', async () => {
    vi.mocked(requestTokenRefresh).mockResolvedValue({ status: 'rate_limited', retryAfterSeconds: 20 });
    const res = await middleware(makeRequest('/report', { ems_refresh_token: 'rt' }));
    expect(isNext(res)).toBe(true);
    expect(res.headers.get('x-rate-limited-retry-after')).toBe('20');
  });

  test('[negative] rate limit tanpa retry-after -> tanpa header', async () => {
    vi.mocked(requestTokenRefresh).mockResolvedValue({ status: 'rate_limited', retryAfterSeconds: null });
    const res = await middleware(makeRequest('/report', { ems_refresh_token: 'rt' }));
    expect(res.headers.get('x-rate-limited-retry-after')).toBeNull();
  });

  test('[negative] backend error saat refresh -> lanjut dalam mode degraded', async () => {
    vi.mocked(requestTokenRefresh).mockResolvedValue({ status: 'server_error' });
    const res = await middleware(makeRequest('/gateway', { ems_refresh_token: 'rt' }));
    expect(isNext(res)).toBe(true);
    expect(res.headers.get('x-session-refresh-degraded')).toBe('1');
  });

  test('[positive] matcher mencakup semua halaman terproteksi', () => {
    for (const prefix of ['dashboard', 'rooms', 'schedule', 'gateway', 'device', 'user', 'role', 'report', 'alarm']) {
      expect(config.matcher).toContain(`/${prefix}/:path*`);
    }
  });
});
