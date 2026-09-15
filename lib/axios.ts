'use client';

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from './toast-store';

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Baca cookie ems_token dari document.cookie (cuma jalan di browser).
 *
 * Dipake di: Request interceptor axios (file ini). lib/socket.ts punya salinan
 *   fungsi yang sama.
 */
function readCookieToken() {
  if (typeof document === 'undefined') return undefined;
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('ems_token='))
    ?.split('=')[1];
  return token ? decodeURIComponent(token) : undefined;
}

api.interceptors.request.use((config) => {
  const token = readCookieToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

/**
 * Ngelanjutin semua request yang lagi nunggu refresh sesi selesai.
 *
 * Dipake di: Response interceptor axios (file ini).
 */
function resolveQueue() {
  pendingQueue.forEach((resolve) => resolve());
  pendingQueue = [];
}

/**
 * Baca detik tunggu dari header retry-after atau ratelimit-reset di
 * AxiosError.
 *
 * Dipake di: showRateLimitToast (file ini).
 */
function getRetryAfterSeconds(err: AxiosError): number | null {
  const headers = err.response?.headers;
  const retryAfter = headers?.['retry-after'];
  if (retryAfter) return Number(retryAfter) || null;
  const reset = headers?.['ratelimit-reset'];
  return reset ? Number(reset) || null : null;
}

let lastRateLimitToastAt = 0;

/**
 * Munculin toast warning 429 sambil nyebutin berapa detik harus nunggu;
 * maksimal sekali tiap 3 detik biar nggak spam.
 *
 * Dipake di: Response interceptor axios (file ini).
 */
function showRateLimitToast(err: AxiosError) {
  const now = Date.now();
  if (now - lastRateLimitToastAt < 3000) return;
  lastRateLimitToastAt = now;

  const seconds = getRetryAfterSeconds(err);
  const message =
    (err.response?.data as { message?: string } | undefined)?.message ??
    'Terlalu banyak request';

  toast.warning(message, {
    description: seconds
      ? `Coba lagi dalam ${seconds} detik. Kamu tetap login.`
      : 'Coba lagi sebentar lagi. Kamu tetap login.',
    duration: seconds ? Math.min(seconds * 1000, 15000) : 6000,
  });
}

/**
 * Panggil route Next POST /api/auth/refresh. Hasilnya ok, rate_limited,
 * server_error, atau invalid.
 *
 * Dipake di: Response interceptor axios (file ini), pas dapet 401.
 */
async function refreshSession(): Promise<
  'ok' | 'rate_limited' | 'server_error' | 'invalid'
> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    if (res.status === 429) return 'rate_limited';
    if (res.status === 503) return 'server_error';
    return res.ok ? 'ok' : 'invalid';
  } catch {
    return 'rate_limited';
  }
}

api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const status = error?.response?.status;
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    if (status === 429) {
      showRateLimitToast(error);
      const message =
        (error?.response?.data as { message?: string } | undefined)?.message ??
        'Terlalu banyak request, coba lagi sebentar';
      return Promise.reject(new ApiError(message, status, 'RATE_LIMITED'));
    }

    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login');

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !isAuthEndpoint
    ) {
      originalRequest._retried = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => pendingQueue.push(resolve));
        return api(originalRequest);
      }

      isRefreshing = true;
      const result = await refreshSession();
      isRefreshing = false;
      resolveQueue();

      if (result === 'ok') {
        return api(originalRequest);
      }

      if (result === 'rate_limited') {
        toast.warning('Sesi belum bisa diperbarui', {
          description:
            'Server sedang membatasi request. Kamu tetap login, coba lagi sebentar.',
          duration: 6000,
        });
        return Promise.reject(
          new ApiError(
            'Terlalu banyak request saat refresh sesi',
            429,
            'RATE_LIMITED'
          )
        );
      }

      if (result === 'server_error') {
        toast.error('Server sedang bermasalah, coba lagi sebentar', {
          duration: 6000,
        });
        return Promise.reject(
          new ApiError(
            'Server sedang bermasalah saat memperbarui sesi',
            503,
            'SERVER_ERROR'
          )
        );
      }

      if (typeof window !== 'undefined') {
        window.location.href = `/login?redirectTo=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    const message =
      (error?.response?.data as { message?: string } | undefined)?.message ??
      error?.message ??
      'Something went wrong';

    return Promise.reject(
      new ApiError(
        message,
        status,
        (error?.response?.data as { code?: string } | undefined)?.code
      )
    );
  }
);
