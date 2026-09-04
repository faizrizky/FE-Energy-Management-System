import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  requestTokenRefresh,
} from '@/lib/auth-shared';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/rooms',
  '/schedule',
  '/gateway',
  '/device',
  '/user',
  '/role',
  '/report',
  '/alarm',
];

const REFRESH_MARGIN_SECONDS = 60;

function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
}

function isExpiredOrExpiringSoon(token: string): boolean {
  const exp = getTokenExpiry(token);
  if (exp === null) return true;
  return exp - Date.now() / 1000 <= REFRESH_MARGIN_SECONDS;
}

function applySessionCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string }
) {
  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (!isProtected) return NextResponse.next();

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const needsRefresh = !accessToken || isExpiredOrExpiringSoon(accessToken);
  if (!needsRefresh) return NextResponse.next();

  if (!refreshToken) return redirectToLogin(request);

  const tokens = await requestTokenRefresh(refreshToken);
  if (!tokens) {
    const response = redirectToLogin(request);
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  request.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken);

  const response = NextResponse.next({ request });
  applySessionCookies(response, tokens);
  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/rooms/:path*',
    '/schedule/:path*',
    '/gateway/:path*',
    '/device/:path*',
    '/user/:path*',
    '/role/:path*',
    '/report/:path*',
    '/alarm/:path*',
  ],
};
