import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('zg_refresh_token');

  if (!refreshToken) {
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/licenses/:path*', '/devices/:path*', '/team/:path*', '/settings/:path*'],
};
