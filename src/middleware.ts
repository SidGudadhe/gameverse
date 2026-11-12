import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getSessionRole(request: NextRequest): string | null {
  const cookie = request.cookies.get('gameverse_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const parsed = JSON.parse(json);

    // Verify token expiration
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null;
    }

    return parsed.role || null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // 1. Path traversal security check in request URL
  if (pathname.includes('..') || pathname.includes('%2e%2e') || pathname.includes('%2E%2E')) {
    return new NextResponse('Access Denied: Path traversal detected.', { status: 403 });
  }

  // 2. Subdomain Routing: Support dedicated domains (e.g. admin.gameverse.com, studio.gameverse.com)
  if (host.startsWith('admin.') && !pathname.startsWith('/admin') && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  if ((host.startsWith('studio.') || host.startsWith('dev.')) && !pathname.startsWith('/developer') && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    const url = request.nextUrl.clone();
    url.pathname = `/developer${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // 3. Extract Role from JWT Session Token
  const userRole = getSessionRole(request);

  // 4. Strict Role Gate for Admin Operations Suite (/admin and /api/admin)
  const isAdminPath = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (isAdminPath || isAdminApi) {
    const isAuthorizedAdmin =
      userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'MODERATOR';

    if (!isAuthorizedAdmin) {
      if (isAdminApi) {
        return NextResponse.json(
          {
            success: false,
            error: userRole
              ? `Forbidden: Admin role required. Current role is '${userRole}'.`
              : 'Unauthorized: Admin authentication required.',
          },
          { status: userRole ? 403 : 401 }
        );
      } else {
        // Redirect browser to login with return path
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        loginUrl.searchParams.set('error', 'admin_required');
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // 5. Strict Role Gate for Developer Studio Portal (/developer and /api/developer)
  const isDevPath = pathname.startsWith('/developer');
  const isDevApi = pathname.startsWith('/api/developer');
  const isOnboardRoute = pathname === '/developer/onboard' || pathname === '/api/developer/onboard';

  if (!isOnboardRoute && (isDevPath || isDevApi)) {
    const isAuthorizedDeveloper =
      userRole === 'DEVELOPER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    if (!isAuthorizedDeveloper) {
      if (isDevApi) {
        // Allow upload if coming from an onboarding process or authenticated context
        if (pathname !== '/api/developer/upload') {
          return NextResponse.json(
            {
              success: false,
              error: userRole
                ? `Forbidden: Developer role required. Current role is '${userRole}'.`
                : 'Unauthorized: Developer authentication required.',
            },
            { status: userRole ? 403 : 401 }
          );
        }
      } else {
        if (!userRole) {
          const loginUrl = new URL('/auth/login', request.url);
          loginUrl.searchParams.set('redirect', pathname);
          return NextResponse.redirect(loginUrl);
        } else if (userRole === 'PLAYER') {
          // Redirect standard players to the creator agreement onboarding page
          const onboardUrl = new URL('/developer/onboard', request.url);
          onboardUrl.searchParams.set('notice', 'agreement_required');
          return NextResponse.redirect(onboardUrl);
        }
      }
    }
  }

  // 6. Security Headers Injection
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // 7. Conditional Content-Security-Policy (CSP)
  if (pathname.startsWith('/sandbox/') || pathname.startsWith('/api/sandbox/')) {
    response.headers.delete('X-Frame-Options');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob: *; media-src 'self' data: blob: *; connect-src 'self' *; frame-ancestors *;"
    );
  } else {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' blob: data:; connect-src 'self' https:; frame-src 'self' http://localhost:3000 http://127.0.0.1:3000 http://localhost:5001 https://*.gameverse.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self';"
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
