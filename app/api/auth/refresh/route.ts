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

  const result = await requestTokenRefresh(refreshToken);

  if (result.status === 'rate_limited') {
    return NextResponse.json(
      {
        message: 'Terlalu banyak percobaan, coba lagi sebentar lagi',
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  if (result.status === 'server_error') {
    return NextResponse.json(
      { message: 'Server sedang bermasalah, coba lagi sebentar' },
      { status: 503 }
    );
  }

  if (result.status === 'invalid') {
    await clearAuthCookies();
    return NextResponse.json({ message: 'Sesi kedaluwarsa' }, { status: 401 });
  }

  await setAuthCookies(result.tokens);
  return NextResponse.json({ ok: true });
}
