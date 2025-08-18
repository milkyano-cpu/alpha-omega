import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isTokenExpired, decodeToken } from '@/lib/token-utils';

// Define routes that require verification
const BOOKING_ROUTES = [
  '/book/services',
  '/book/barbers', 
  '/book/appointment',
  '/book/thank-you',
];

// Define routes that require authentication
const PROTECTED_ROUTES = [
  '/my-bookings',
  '/admin',
  ...BOOKING_ROUTES,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes, static files, and auth pages
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/verify'
  ) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isBookingRoute = BOOKING_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Get token from cookies or check localStorage (we'll use a custom header approach)
    const token = request.cookies.get('token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    // Debug logging
    console.log('🔍 Middleware Debug:', {
      pathname,
      hasToken: !!token,
      tokenSource: token ? (request.cookies.get('token') ? 'cookie' : 'header') : 'none',
      cookieToken: request.cookies.get('token')?.value?.substring(0, 20) + '...',
      cookieNames: request.cookies.getAll().map(cookie => cookie.name),
      isBookingRoute
    });

    // If no token, redirect to login
    if (!token) {
      console.log('❌ No token found, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if token is expired
    try {
      if (isTokenExpired(token)) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      // Invalid token format
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For booking routes, check if user is verified
    if (isBookingRoute) {
      try {
        // Decode the token to check verification status
        const payload = decodeToken(token);
        
        console.log('🔍 Token payload from middleware:', { 
          verified: payload.verified, 
          email: payload.email,
          id: payload.id,
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 20) + '...'
        });
        
        // If user is not verified, redirect to verification page
        if (!payload.verified) {
          console.log('❌ User not verified, redirecting to verify page');
          const verifyUrl = new URL('/verify', request.url);
          return NextResponse.redirect(verifyUrl);
        } else {
          console.log('✅ User verified, allowing access');
        }
      } catch (error) {
        console.log('❌ Error decoding token:', error);
        // If we can't decode the token, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};