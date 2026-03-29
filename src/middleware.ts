import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

const ROLE_DASHBOARD: Record<string, string> = {
  HQ_DIRECTOR: '/',
  FRANCHISE_MANAGER: '/',
  EXECUTIVE_VIEWER: '/',
  REGIONAL_MANAGER: '/dashboard/regional',
  AREA_MANAGER: '/dashboard/area',
  BRANCH_MANAGER: '/dashboard/branch',
  FIELD_AUDITOR: '/dashboard/auditor',
};

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('bp_session');
  const { pathname } = request.nextUrl;

  // Allow login page and auth API routes
  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Allow API routes (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Redirect to login if no session
  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Parse session cookie for role-based routing
  const session = getSessionFromCookie(sessionCookie.value);
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow /dashboard/* routes for role-specific dashboards
  if (pathname.startsWith('/dashboard/')) {
    return NextResponse.next();
  }

  // Route root path to role-appropriate dashboard
  if (pathname === '/') {
    const target = ROLE_DASHBOARD[session.role];
    if (target && target !== '/') {
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
