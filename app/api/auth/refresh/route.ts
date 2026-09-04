import { NextResponse } from 'next/server';
import {
  getRefreshTokenValue,
  setAuthCookies,
  clearAuthCookies,
} from '@/lib/auth';
import { requestTokenRefresh } from '@/lib/auth-shared';

export async function POST() {
  const refreshToken = await getRefreshTokenValue();
  if (!refreshToken) {
    return NextResponse.json(
      { message: 'Tidak ada sesi aktif' },
      { status: 401 }
    );
  }

  const tokens = await requestTokenRefresh(refreshToken);
  if (!tokens) {
    await clearAuthCookies();
    return NextResponse.json({ message: 'Sesi kedaluwarsa' }, { status: 401 });
  }

  await setAuthCookies(tokens);
  return NextResponse.json({ ok: true });
}
