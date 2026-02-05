import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/api/auth/login'];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check auth for dashboard and API routes
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/eis') ||
    pathname.startsWith('/api/ingest')
  ) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      // Redirect to login for page routes, return 401 for API
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET ||
          'super-secret-key-change-in-production-min-32-chars'
      );

      await jwtVerify(token, secret);

      return NextResponse.next();
    } catch (error) {
      // Token invalid or expired
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Token tidak valid' },
          { status: 401 }
        );
      }

      // Clear invalid token and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/eis/:path*', '/api/ingest/:path*']
};
