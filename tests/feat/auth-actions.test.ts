import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/auth', () => ({
  setAuthCookies: vi.fn(),
  clearAuthCookies: vi.fn(),
  getRefreshTokenValue: vi.fn(),
}));

import { redirect } from 'next/navigation';
import { clearAuthCookies, getRefreshTokenValue, setAuthCookies } from '@/lib/auth';
import { loginAction, logoutAction } from '@/feat/auth/actions';

const fetchMock = vi.fn();
const json = (status: number, body: unknown) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  vi.mocked(setAuthCookies).mockReset();
  vi.mocked(clearAuthCookies).mockReset();
  vi.mocked(getRefreshTokenValue).mockReset();
  vi.mocked(redirect).mockReset();
});

afterEach(() => vi.unstubAllGlobals());

describe('loginAction', () => {
  test('[positive] sukses -> cookie disimpan, captcha ikut dikirim', async () => {
    fetchMock.mockResolvedValue(json(200, { data: { accessToken: 'a', refreshToken: 'b' } }));
    await expect(loginAction({ username: 'admin', password: 'admin' }, 'captcha')).resolves.toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/auth/login', expect.objectContaining({
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({ username: 'admin', password: 'admin', captchaToken: 'captcha' }),
    }));
    expect(setAuthCookies).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'b' });
  });

  test('[negative] input tidak valid -> pesan validasi pertama tanpa request', async () => {
    await expect(loginAction({ username: '', password: '' })).resolves.toEqual({
      success: false,
      message: 'Username or email is required',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('[negative] kredensial salah -> pesan server; akun terkunci (423) -> lockedOut', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { message: 'Username/Email atau password salah' }));
    await expect(loginAction({ username: 'a', password: 'b' })).resolves.toEqual({
      success: false,
      message: 'Username/Email atau password salah',
      lockedOut: false,
    });
    fetchMock.mockResolvedValueOnce(json(423, { message: 'Akun terkunci' }));
    await expect(loginAction({ username: 'a', password: 'b' })).resolves.toMatchObject({ lockedOut: true });
    expect(setAuthCookies).not.toHaveBeenCalled();
  });

  test('[negative] body error bukan JSON -> "Login failed"', async () => {
    fetchMock.mockResolvedValue(json(502, '<html>'));
    await expect(loginAction({ username: 'a', password: 'b' })).resolves.toMatchObject({ success: false, message: 'Login failed' });
  });

  test('[negative] network error -> pesan error', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(loginAction({ username: 'a', password: 'b' })).resolves.toEqual({ success: false, message: 'ECONNREFUSED' });
  });

  test('[negative] respons 200 tanpa token lengkap -> tidak menyimpan cookie', async () => {
    fetchMock.mockResolvedValue(json(200, { data: { accessToken: 'a' } }));
    await expect(loginAction({ username: 'a', password: 'b' })).resolves.toEqual({
      success: false,
      message: 'Unexpected response from server',
    });
    expect(setAuthCookies).not.toHaveBeenCalled();
  });
});

describe('logoutAction', () => {
  test('[positive] refresh token dicabut di backend, cookie dihapus, redirect login', async () => {
    vi.mocked(getRefreshTokenValue).mockResolvedValue('rt');
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await logoutAction();
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/auth/logout', expect.objectContaining({ body: JSON.stringify({ refreshToken: 'rt' }) }));
    expect(clearAuthCookies).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  test('[negative] backend tidak bisa dihubungi -> tetap logout lokal', async () => {
    vi.mocked(getRefreshTokenValue).mockResolvedValue('rt');
    fetchMock.mockRejectedValue(new Error('offline'));
    await logoutAction();
    expect(clearAuthCookies).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  test('[negative] tanpa refresh token -> tidak memanggil backend', async () => {
    vi.mocked(getRefreshTokenValue).mockResolvedValue(undefined);
    await logoutAction();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(clearAuthCookies).toHaveBeenCalled();
  });
});
