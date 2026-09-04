'use client';

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

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

  headers: {
    'Content-Type': 'application/json',
  },
});

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
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

function resolveQueue() {
  pendingQueue.forEach((resolve) => resolve());
  pendingQueue = [];
}

async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
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
      const refreshed = await refreshSession();
      isRefreshing = false;
      resolveQueue();

      if (refreshed) {
        return api(originalRequest);
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
