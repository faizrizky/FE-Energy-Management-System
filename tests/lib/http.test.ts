import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ getAccessToken: vi.fn() }));

import { getAccessToken } from '@/lib/auth';
import { http } from '@/lib/http';

const fetchMock = vi.fn();
const json = (status: number, body: unknown) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  vi.mocked(getAccessToken).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('http (server-side fetch)', () => {
  test('[positive] GET dengan token cookie, envelope data dibuka, opsi cache diteruskan', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('tok');
    fetchMock.mockResolvedValue(json(200, { data: [{ id: 1 }] }));

    await expect(http('/rooms?page=1', { cache: 'no-store' })).resolves.toEqual([{ id: 1 }]);

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/rooms?page=1', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' },
      body: undefined,
      cache: 'no-store',
      next: undefined,
    });
  });

  test('[positive] POST dengan body JSON & opsi next.revalidate', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('tok');
    fetchMock.mockResolvedValue(json(200, { data: { ok: true } }));
    await http('/x', { method: 'POST', body: { a: 1 }, next: { revalidate: 300 } });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: '{"a":1}', next: { revalidate: 300 } });
  });

  test('[negative] tanpa cookie & tanpa DEV_API_TOKEN -> tanpa Authorization', async () => {
    vi.mocked(getAccessToken).mockResolvedValue(undefined);
    vi.stubEnv('DEV_API_TOKEN', '');
    fetchMock.mockResolvedValue(json(200, { data: null }));
    await http('/x');
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ 'Content-Type': 'application/json' });
  });

  // Fallback token dev tidak dibatasi environment: di production request tanpa sesi tetap membawa token.
  test.fails('[BUG] DEV_API_TOKEN seharusnya tidak dipakai saat NODE_ENV=production', async () => {
    vi.mocked(getAccessToken).mockResolvedValue(undefined);
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DEV_API_TOKEN', 'dev-token');
    fetchMock.mockResolvedValue(json(200, { data: null }));
    await http('/x');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  test('[negative] 401 -> error berstatus 401 dengan pesan sesi berakhir', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('expired');
    fetchMock.mockResolvedValue(json(401, { message: 'Token tidak valid' }));
    await expect(http('/x')).rejects.toMatchObject({ status: 401, message: 'Sesi telah berakhir, silakan login kembali' });
  });

  test('[negative] error lain memakai message dari body; body bukan JSON -> "Request failed: <status>"', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('tok');
    fetchMock.mockResolvedValueOnce(json(403, { message: 'Akses ditolak' }));
    await expect(http('/x')).rejects.toThrow('Akses ditolak');
    fetchMock.mockResolvedValueOnce(json(502, '<html>'));
    await expect(http('/x')).rejects.toThrow('Request failed: 502');
  });

  test('[negative] network error diteruskan apa adanya', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('tok');
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    await expect(http('/x')).rejects.toThrow('fetch failed');
  });
});
