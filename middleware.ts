/**
 * Next.js Middleware - taxbook-pro
 * Generated: 2026-01-19
 *
 * Edge middleware for authentication, request logging, and route protection.
 * Runs on every request matching the configured matcher patterns.
 *
 * Features:
 * - Supabase session verification
 * - Protected route enforcement with redirect to login
 * - Public route exceptions (login, signup, public pages)
 * - Distributed tracing with correlation IDs
 * - Structured logging with request context
 * - Request metrics (count, duration)
 * - Rate limiting headers (optional)
 *
 * OBSERVABILITY:
 * - Creates root span for each request
 * - Adds X-Request-ID and X-Trace-ID headers for correlation
 * - Records http_requests_total and http_request_duration_ms metrics
 * - Uses structured logger with request context
 *
 * Place in: middleware.ts (project root)
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  tracer,
  logger,
  httpRequestTotal,
  httpRequestDuration,
} from '@/lib/observability';
import {
  rateLimitMiddleware,
  applyRateLimitHeaders,
  isRateLimitEnabled,
} from '@/lib/rate-limit';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// ============================================================
// ROUTE CONFIGURATION
// ============================================================

/**
 * Routes that require authentication.
 * Users without a valid session will be redirected to the login page.
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/settings',
  '/profile',
  '/api/protected',
  '/profiles',
  '/clients',
  '/services',
  '/appointments',
  '/availabilities',
  '/documents',
];

/**
 * Routes that are always public (no auth required).
 * These routes bypass authentication checks entirely.
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/auth/confirm',
  '/auth/reset-password',
  '/api/health',
  '/api/public',
];

/**
 * API routes that should bypass auth but still run middleware.
 * Useful for webhooks, public APIs, etc.
 */
const PUBLIC_API_ROUTES = [
  '/api/webhooks',
  '/api/cron',
];

/**
 * Static assets and Next.js internals to skip entirely.
 */
const SKIP_PATTERNS = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
];

// ============================================================
// CONFIGURATION
// ============================================================

interface MiddlewareConfig {
  /** Enable request logging to console */
  enableLogging: boolean;
  /** Default redirect path when auth fails */
  loginPath: string;
  /** Redirect path after successful login */
  afterLoginPath: string;
  /** Enable security headers */
  enableSecurityHeaders: boolean;
}

const config: MiddlewareConfig = {
  enableLogging: process.env.NODE_ENV === 'development',
  loginPath: '/login',
  afterLoginPath: '/dashboard',
  enableSecurityHeaders: true,
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if the path matches any pattern in the list.
 * Supports exact matches and prefix matches (e.g., '/api' matches '/api/users').
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => {
    // Exact match
    if (pathname === route) return true;
    // Prefix match (route pattern with trailing content)
    if (pathname.startsWith(`${route}/`)) return true;
    return false;
  });
}

/**
 * Check if the path should skip middleware entirely.
 */
function shouldSkip(pathname: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pathname.startsWith(pattern));
}

/**
 * Check if the route requires authentication.
 */
function isProtectedRoute(pathname: string): boolean {
  // Explicitly public routes are never protected
  if (matchesRoute(pathname, PUBLIC_ROUTES)) return false;
  if (matchesRoute(pathname, PUBLIC_API_ROUTES)) return false;

  // Check if it's in the protected routes list
  return matchesRoute(pathname, PROTECTED_ROUTES);
}

/**
 * Calculate duration in milliseconds.
 */
function getDurationMs(startTime: number): number {
  return Date.now() - startTime;
}

/**
 * Format duration for display.
 */
function formatDuration(durationMs: number): string {
  return durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(2)}s`;
}

// ============================================================
// SECURITY HEADERS
// ============================================================

/**
 * Apply security headers to the response.
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  if (!config.enableSecurityHeaders) return response;

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (restrict sensitive features)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

// ============================================================
// SUPABASE CLIENT
// ============================================================

/**
 * Create Supabase client for middleware (Edge runtime).
 * Handles cookie operations for session management.
 */
function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
}

// ============================================================
// MAIN MIDDLEWARE
// ============================================================

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Skip static assets and Next.js internals
  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  // Create root span for request tracing
  const span = tracer.startSpan(`${method} ${pathname}`, {
    attributes: {
      'http.method': method,
      'http.url': pathname,
      'http.target': request.nextUrl.search || '',
      'http.user_agent': request.headers.get('user-agent') || '',
    },
  });

  // Create context for correlation
  const context = tracer.createContext(span);
  logger.pushContext(context);

  // Record request metric
  httpRequestTotal.inc({ method, path: pathname, status: 'started' });

  // Create response that we'll modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add correlation headers to response
  response.headers.set('X-Request-ID', context.correlationId);
  response.headers.set('X-Trace-ID', span.traceId);

  // Apply security headers
  response = applySecurityHeaders(response);

  // Rate limiting for API routes
  if (pathname.startsWith('/api') && isRateLimitEnabled()) {
    span.addEvent('rate_limit_check');
    const rateLimitResult = await rateLimitMiddleware(request);

    if (rateLimitResult) {
      // Request is rate limited - return 429 response
      span.addEvent('rate_limited');
      rateLimitResult.headers.set('X-Request-ID', context.correlationId);
      rateLimitResult.headers.set('X-Trace-ID', span.traceId);

      const durationMs = getDurationMs(startTime);
      httpRequestDuration.observe(durationMs, { method, path: pathname, status: '429' });
      httpRequestTotal.inc({ method, path: pathname, status: '429' });

      logger.info('Request rate limited', {
        method,
        path: pathname,
        durationMs,
      });

      span.setStatus('error', 'rate_limited');
      span.end();
      logger.popContext();

      return rateLimitResult;
    }
  }

  // Helper to finalize response with metrics and cleanup
  const finalizeResponse = (res: NextResponse, status: number, details?: string) => {
    const durationMs = getDurationMs(startTime);

    // Record duration metric
    httpRequestDuration.observe(durationMs, { method, path: pathname, status: String(status) });

    // Update request count with final status
    httpRequestTotal.inc({ method, path: pathname, status: String(status) });

    // Log request completion
    if (config.enableLogging) {
      logger.info('Request completed', {
        method,
        path: pathname,
        status,
        durationMs,
        duration: formatDuration(durationMs),
        details,
      });
    }

    // End span
    span.addEvent('response', { status, durationMs });
    span.setStatus(status >= 400 ? 'error' : 'ok', details);
    span.end();

    // Pop logger context
    logger.popContext();

    return res;
  };

  // Check if route requires authentication
  if (!isProtectedRoute(pathname)) {
    span.addEvent('public_route');
    return finalizeResponse(response, 200, 'public route');
  }

  // Create Supabase client and verify session
  try {
    const supabase = createMiddlewareClient(request, response);
    span.addEvent('auth_check_started');

    // Refresh session if expired
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      // No valid session - redirect to login
      const loginUrl = new URL(config.loginPath, request.url);

      // Preserve the original URL for redirect after login
      loginUrl.searchParams.set('redirectTo', pathname);

      span.addEvent('auth_required', { redirectTo: config.loginPath });

      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.headers.set('X-Request-ID', context.correlationId);
      redirectResponse.headers.set('X-Trace-ID', span.traceId);

      return finalizeResponse(redirectResponse, 302, 'auth required -> login');
    }

    // Valid session - add user info to headers for downstream use
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-email', user.email || '');

    span.addEvent('authenticated', { userId: user.id });

    return finalizeResponse(response, 200, `user: ${user.email}`);
  } catch (error) {
    // Log error with structured logger
    logger.error('Middleware auth error', {
      path: pathname,
      method,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    span.addEvent('auth_error', {
      error: error instanceof Error ? error.message : 'unknown',
    });

    const loginUrl = new URL(config.loginPath, request.url);
    loginUrl.searchParams.set('error', 'session_error');

    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.headers.set('X-Request-ID', context.correlationId);
    redirectResponse.headers.set('X-Trace-ID', span.traceId);

    return finalizeResponse(redirectResponse, 302, 'auth error -> login');
  }
}

// ============================================================
// MATCHER CONFIGURATION
// ============================================================

/**
 * Configure which routes the middleware runs on.
 * This runs BEFORE the middleware function and determines
 * if the middleware should be invoked at all.
 *
 * Patterns:
 * - Specific paths: '/about'
 * - Path groups: '/(auth|dashboard)/:path*'
 * - Negative lookahead: '/((?!api|_next/static|_next/image|favicon.ico).*)'
 */
export const middlewareConfig = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// ============================================================
// TYPES EXPORT
// ============================================================

export type { MiddlewareConfig };

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
