'use server';

import { redirect } from 'next/navigation';
import { loginFormSchema, type LoginFormValues } from './schema';
import {
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenValue,
} from '@/lib/auth';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

export interface LoginActionResult {
  success: boolean;
  message?: string;
}

export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshTokenValue();

  if (refreshToken) {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      });
    } catch {}
  }

  await clearAuthCookies();
  redirect('/login');
}

export async function loginAction(
  values: LoginFormValues
): Promise<LoginActionResult> {
  const parsed = loginFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: parsed.data.email,
        password: parsed.data.password,
      }),
      cache: 'no-store',
    });
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error',
    };
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { success: false, message: body?.message ?? 'Login failed' };
  }

  const accessToken: string | undefined = body?.data?.accessToken;
  const refreshToken: string | undefined = body?.data?.refreshToken;

  if (!accessToken || !refreshToken) {
    return { success: false, message: 'Unexpected response from server' };
  }

  await setAuthCookies({ accessToken, refreshToken });

  return { success: true };
}
