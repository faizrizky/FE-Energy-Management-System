'use client';

import axios from 'axios';

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

api.interceptors.request.use((config) => {
  if (typeof document === 'undefined') {
    return config;
  }

  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('ems_token='))
    ?.split('=')[1];

  if (token) {
    config.headers.Authorization = `Bearer ${decodeURIComponent(token)}`;
  }

  return config;
});

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
  (error) => {
    const status = error?.response?.status;

    const message =
      error?.response?.data?.message ??
      error?.message ??
      'Something went wrong';

    return Promise.reject(
      new ApiError(message, status, error?.response?.data?.code)
    );
  }
);
