import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/toast-store', () => ({
  toast: { warning: vi.fn(), error: vi.fn() },
}));

import { toast } from '@/lib/toast-store';

type Reply = { status: number; data?: unknown; headers?: Record<string, string> };
type Handler = (config: InternalAxiosRequestConfig) => Reply | Promise<Reply> | 'network-error';

let handler: Handler;
const originalLocation = window.location;
const fetchMock = vi.fn();

async function loadApi() {
  vi.resetModules();
  const mod = await import('@/lib/axios');
  mod.api.defaults.adapter = async (config) => {
    const reply = await handler(config);
    if (reply === 'network-error') {
      throw new AxiosError('Network Error', 'ERR_NETWORK', config);
    }
    const response: AxiosResponse = {
      data: reply.data,
      status: reply.status,
      statusText: String(reply.status),
      headers: reply.headers ?? {},
      config,
    };
    if (reply.status >= 400) {
      throw new AxiosError(`Request failed with status code ${reply.status}`, 'ERR_BAD_RESPONSE', config, null, response);
    }
    return response;
  };
  return mod;
}

function refreshReturns(...statuses: Array<number | 'throw'>) {
  for (const status of statuses) {
    if (status === 'throw') fetchMock.mockRejectedValueOnce(new Error('offline'));
    else fetchMock.mockResolvedValueOnce(new Response(null, { status }));
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  document.cookie = 'ems_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href: 'http://localhost/rooms', pathname: '/rooms' },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});

describe('request interceptor', () => {
  test('[positive] token dari cookie ems_token dikirim sebagai Bearer (di-decode)', async () => {
    document.cookie = `ems_token=${encodeURIComponent('abc.def=')}; path=/`;
    handler = (config) => {
      expect(config.headers.Authorization).toBe('Bearer abc.def=');
      expect(config.baseURL).toBe('http://api.test/api');
      return { status: 200, data: {} };
    };
    const { api } = await loadApi();
    await api.get('/devices');
  });

  test('[negative] tanpa cookie -> tanpa header Authorization', async () => {
    handler = (config) => {
      expect(config.headers.Authorization).toBeUndefined();
      return { status: 200, data: {} };
    };
    const { api } = await loadApi();
    await api.get('/devices');
  });
});

describe('response unwrap', () => {
  test('[positive] envelope { data } dibuka', async () => {
    handler = () => ({ status: 200, data: { data: { id: 1 } } });
    const { api } = await loadApi();
    expect((await api.get('/x')).data).toEqual({ id: 1 });
  });

  test('[negative] response tanpa key data / bukan object dibiarkan', async () => {
    const { api } = await loadApi();
    handler = () => ({ status: 200, data: { items: [] } });
    expect((await api.get('/x')).data).toEqual({ items: [] });
    handler = () => ({ status: 200, data: 'plain text' });
    expect((await api.get('/x')).data).toBe('plain text');
    handler = () => ({ status: 204, data: '' });
    expect((await api.get('/x')).data).toBe('');
  });
});

describe('error handling', () => {
  test('[negative] error biasa -> ApiError dengan message, status & code dari server', async () => {
    handler = () => ({ status: 409, data: { message: 'Device masih dipakai', code: 'IN_USE' } });
    const { api, ApiError } = await loadApi();
    const err = await api.delete('/devices/1').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ message: 'Device masih dipakai', status: 409, code: 'IN_USE' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('[negative] tanpa body message -> pesan axios; network error -> status undefined', async () => {
    const { api } = await loadApi();
    handler = () => ({ status: 500, data: {} });
    await expect(api.get('/x')).rejects.toMatchObject({ message: 'Request failed with status code 500', status: 500 });
    handler = () => 'network-error';
    await expect(api.get('/x')).rejects.toMatchObject({ message: 'Network Error', status: undefined });
  });

  test('[negative] 429 -> ApiError RATE_LIMITED + toast dengan detik retry-after', async () => {
    handler = () => ({ status: 429, data: { message: 'Terlalu sering' }, headers: { 'retry-after': '12' } });
    const { api } = await loadApi();
    await expect(api.post('/devices/1/power')).rejects.toMatchObject({ status: 429, code: 'RATE_LIMITED', message: 'Terlalu sering' });
    expect(toast.warning).toHaveBeenCalledWith('Terlalu sering', {
      description: 'Coba lagi dalam 12 detik. Kamu tetap login.',
      duration: 12000,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('[negative] toast 429 dibatasi 1x per 3 detik; header ratelimit-reset sebagai fallback', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-15T10:00:00Z'));
    handler = () => ({ status: 429, data: {}, headers: { 'ratelimit-reset': '60' } });
    const { api } = await loadApi();

    await api.get('/x').catch(() => {});
    await api.get('/x').catch(() => {});
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledWith('Terlalu banyak request', expect.objectContaining({ duration: 15000 }));

    vi.setSystemTime(new Date('2026-09-15T10:00:04Z'));
    await api.get('/x').catch(() => {});
    expect(toast.warning).toHaveBeenCalledTimes(2);
  });

  test('[negative] 429 tanpa header -> durasi default 6 detik', async () => {
    handler = () => ({ status: 429, data: {} });
    const { api } = await loadApi();
    await api.get('/x').catch(() => {});
    expect(toast.warning).toHaveBeenCalledWith('Terlalu banyak request', {
      description: 'Coba lagi sebentar lagi. Kamu tetap login.',
      duration: 6000,
    });
  });
});

describe('401 -> refresh session', () => {
  test('[positive] refresh berhasil -> request asli diulang sekali & berhasil', async () => {
    let calls = 0;
    handler = () => (++calls === 1 ? { status: 401, data: {} } : { status: 200, data: { data: 'ok' } });
    refreshReturns(200);
    const { api } = await loadApi();

    await expect(api.get('/devices')).resolves.toMatchObject({ data: 'ok' });
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/refresh', { method: 'POST' });
    expect(calls).toBe(2);
  });

  test('[positive] beberapa request 401 bersamaan -> refresh hanya sekali, semua diulang', async () => {
    const seen = new Map<string, number>();
    handler = (config) => {
      const n = (seen.get(config.url!) ?? 0) + 1;
      seen.set(config.url!, n);
      return n === 1 ? { status: 401, data: {} } : { status: 200, data: { data: config.url } };
    };
    let resolveRefresh!: (r: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise((r) => (resolveRefresh = r)));
    const { api } = await loadApi();

    const a = api.get('/a');
    const b = api.get('/b');
    await vi.waitFor(() => expect(seen.get('/b')).toBe(1));
    resolveRefresh(new Response(null, { status: 200 }));

    await expect(Promise.all([a, b])).resolves.toEqual([
      expect.objectContaining({ data: '/a' }),
      expect.objectContaining({ data: '/b' }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('[negative] refresh ditolak -> redirect ke login dengan redirectTo & tetap reject', async () => {
    handler = () => ({ status: 401, data: { message: 'Token kadaluarsa' } });
    refreshReturns(401);
    const { api } = await loadApi();
    await expect(api.get('/devices')).rejects.toMatchObject({ status: 401, message: 'Token kadaluarsa' });
    expect(window.location.href).toBe('/login?redirectTo=%2Frooms');
  });

  test('[negative] setelah refresh sukses masih 401 -> tidak loop, refresh hanya sekali', async () => {
    handler = () => ({ status: 401, data: {} });
    refreshReturns(200);
    const { api } = await loadApi();
    await expect(api.get('/devices')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test.each([
    [429, 'RATE_LIMITED', 'warning'],
    ['throw' as const, 'RATE_LIMITED', 'warning'],
    [503, 'SERVER_ERROR', 'error'],
  ])('[negative] refresh %s -> ApiError %s + toast %s, tetap login (tidak redirect)', async (refresh, code, toastType) => {
    handler = () => ({ status: 401, data: {} });
    refreshReturns(refresh);
    const { api } = await loadApi();
    await expect(api.get('/devices')).rejects.toMatchObject({ code });
    expect(toast[toastType as 'warning' | 'error']).toHaveBeenCalled();
    expect(window.location.href).toBe('http://localhost/rooms');
  });

  test('[negative] 401 dari /auth/login tidak memicu refresh', async () => {
    handler = () => ({ status: 401, data: { message: 'Password salah' } });
    const { api } = await loadApi();
    await expect(api.post('/auth/login')).rejects.toMatchObject({ message: 'Password salah' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
