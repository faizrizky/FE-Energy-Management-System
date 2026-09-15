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
  lockedOut?: boolean;
}

/**
 * Server action logout: cabut refresh token di backend (kalo gagal tetep
 * lanjut), hapus cookie, terus redirect ke /login.
 *
 * Dipake di: components/shared/sidebar.tsx (tombol Log out).
 */
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

/**
 * Server action login: validasi input, POST /auth/login (plus captcha), simpen
 * cookie token kalo berhasil. Balikin { success, message, lockedOut } buat
 * ditampilin form.
 *
 * Dipake di: app/login/client.tsx → LoginClient.
 */
export async function loginAction(
  values: LoginFormValues,
  captchaToken?: string
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
        username: parsed.data.username,
        password: parsed.data.password,
        captchaToken,
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
    return {
      success: false,
      message: body?.message ?? 'Login failed',
      lockedOut: res.status === 423,
    };
  }

  const accessToken: string | undefined = body?.data?.accessToken;
  const refreshToken: string | undefined = body?.data?.refreshToken;

  if (!accessToken || !refreshToken) {
    return { success: false, message: 'Unexpected response from server' };
  }

  await setAuthCookies({ accessToken, refreshToken });

  return { success: true };
}
