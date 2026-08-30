'use server';

import { cookies } from 'next/headers';
import { loginFormSchema, type LoginFormValues } from './schema';
import { redirect } from 'next/navigation';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

export interface LoginActionResult {
  success: boolean;
  message?: string;
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete('ems_token');
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

  const token: string | undefined = body?.data?.token;
  if (!token) {
    return { success: false, message: 'Unexpected response from server' };
  }

  (await cookies()).set('ems_token', token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  return { success: true };
}
