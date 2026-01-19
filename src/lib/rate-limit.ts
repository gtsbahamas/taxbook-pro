/**
 * Rate Limiting Library - taxbook-pro
 * Generated: 2026-01-19
 *
 * Configurable rate limiting with Redis/Upstash support for distributed systems.
 * Implements sliding window algorithm for accurate rate limiting.
 *
 * Features:
 * - Per-route rate limit definitions
 * - Per-user and per-IP limits
 * - Automatic Upstash Redis initialization from environment variables
 * - In-memory fallback for development (with warning)
 * - Next.js middleware helper
 * - Standard rate limit headers (X-RateLimit-*)
 * - Observability integration (logging, metrics)
 *
 * ENVIRONMENT VARIABLES:
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST URL
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST token
 * - RATE_LIMIT_ENABLED: Set to 'false' to disable (default: true)
 *
 * Usage:
 *   import { rateLimit, withRateLimit } from '@/lib/rate-limit';
 *
 *   // In API route
 *   const result = await rateLimit(request, 'api');
 *   if (!result.ok) {
 *     return new Response('Too Many Requests', { status: 429 });
 *   }
 *
 *   // Or use middleware helper
 *   export const GET = withRateLimit(handler, 'api');
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Result } from '@/types/errors';
import { logger } from '@/lib/observability';

// ============================================================
// RATE LIMIT CONFIGURATION TYPES
// ============================================================

/**
 * Rate limit configuration for a specific route or tier.
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  readonly limit: number;
  /** Time window in seconds */
  readonly windowSeconds: number;
  /** Optional burst limit (allows short bursts above normal limit) */
  readonly burstLimit?: number;
  /** Whether to apply per-user limits (requires auth) */
  readonly perUser?: boolean;
  /** Whether to apply per-IP limits */
  readonly perIp?: boolean;
  /** Custom identifier function */
  readonly getIdentifier?: (request: NextRequest) => string | Promise<string>;
}

/**
 * Rate limit result returned after checking limits.
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  readonly allowed: boolean;
  /** Maximum requests allowed in the window */
  readonly limit: number;
  /** Remaining requests in the current window */
  readonly remaining: number;
  /** Unix timestamp when the window resets */
  readonly reset: number;
  /** Seconds until the window resets */
  readonly retryAfter: number;
}

/**
 * Error codes for rate limiting operations.
 */
export type RateLimitErrorCode =
  | 'rate_limited'
  | 'storage_error'
  | 'invalid_config'
  | 'unknown';

/**
 * Rate limit error type.
 */
export interface RateLimitError {
  readonly code: RateLimitErrorCode;
  readonly message: string;
  readonly retryAfter?: number;
}

/**
 * Rate limit tiers for different route types.
 */
export type RateLimitTier =
  | 'api'          // Standard API routes
  | 'auth'         // Authentication endpoints (stricter)
  | 'upload'       // File upload endpoints
  | 'webhook'      // Webhook endpoints (lenient)
  | 'public'       // Public endpoints
  | 'premium';     // Premium tier users

// ============================================================
// RATE LIMIT METRICS
// ============================================================

/**
 * Rate limit metrics for observability.
 * These are simple counters - integrate with your metrics system.
 */
class RateLimitMetrics {
  private requestsChecked = 0;
  private requestsAllowed = 0;
  private requestsBlocked = 0;
  private storageErrors = 0;

  inc(type: 'checked' | 'allowed' | 'blocked' | 'storage_error'): void {
    switch (type) {
      case 'checked':
        this.requestsChecked++;
        break;
      case 'allowed':
        this.requestsAllowed++;
        break;
      case 'blocked':
        this.requestsBlocked++;
        break;
      case 'storage_error':
        this.storageErrors++;
        break;
    }
  }

  getStats(): {
    checked: number;
    allowed: number;
    blocked: number;
    storageErrors: number;
    blockRate: number;
  } {
    return {
      checked: this.requestsChecked,
      allowed: this.requestsAllowed,
      blocked: this.requestsBlocked,
      storageErrors: this.storageErrors,
      blockRate: this.requestsChecked > 0
        ? this.requestsBlocked / this.requestsChecked
        : 0,
    };
  }

  /**
   * Export metrics in Prometheus format.
   */
  exportPrometheus(): string {
    return [
      '# HELP rate_limit_requests_total Total rate limit checks',
      '# TYPE rate_limit_requests_total counter',
      `rate_limit_requests_total{result="checked"} ${this.requestsChecked}`,
      `rate_limit_requests_total{result="allowed"} ${this.requestsAllowed}`,
      `rate_limit_requests_total{result="blocked"} ${this.requestsBlocked}`,
      '',
      '# HELP rate_limit_storage_errors_total Rate limit storage errors',
      '# TYPE rate_limit_storage_errors_total counter',
      `rate_limit_storage_errors_total ${this.storageErrors}`,
      '',
      '# HELP rate_limit_block_rate Rate limit block ratio',
      '# TYPE rate_limit_block_rate gauge',
      `rate_limit_block_rate ${this.getStats().blockRate.toFixed(4)}`,
    ].join('\n');
  }
}

/** Global rate limit metrics instance */
export const rateLimitMetrics = new RateLimitMetrics();

// ============================================================
// CONFIGURATION
// ============================================================

/**
 * Check if rate limiting is enabled via environment variable.
 */
export function isRateLimitEnabled(): boolean {
  const enabled = process.env.RATE_LIMIT_ENABLED;
  return enabled !== 'false';
}

/**
 * Check if Upstash Redis is configured.
 */
export function isUpstashConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

// ============================================================
// DEFAULT RATE LIMIT CONFIGURATIONS
// ============================================================

/**
 * Default rate limit configurations by tier.
 * Adjust these based on your application's needs.
 */
export const DEFAULT_RATE_LIMITS: Record<RateLimitTier, RateLimitConfig> = {
  api: {
    limit: 100,
    windowSeconds: 60,
    burstLimit: 10,
    perUser: true,
    perIp: true,
  },
  auth: {
    limit: 10,
    windowSeconds: 60,
    burstLimit: 3,
    perIp: true,
  },
  upload: {
    limit: 20,
    windowSeconds: 60,
    burstLimit: 5,
    perUser: true,
    perIp: true,
  },
  webhook: {
    limit: 1000,
    windowSeconds: 60,
    perIp: true,
  },
  public: {
    limit: 60,
    windowSeconds: 60,
    burstLimit: 10,
    perIp: true,
  },
  premium: {
    limit: 500,
    windowSeconds: 60,
    burstLimit: 50,
    perUser: true,
  },
};

// ============================================================
// PER-ROUTE RATE LIMIT DEFINITIONS
// ============================================================

/**
 * Route-specific rate limit overrides.
 * Patterns support glob-style matching.
 */
export const ROUTE_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication routes - strict limits
  '/api/auth/login': {
    limit: 5,
    windowSeconds: 60,
    perIp: true,
  },
  '/api/auth/register': {
    limit: 3,
    windowSeconds: 60,
    perIp: true,
  },
  '/api/auth/reset-password': {
    limit: 3,
    windowSeconds: 300, // 5 minutes
    perIp: true,
  },

  // File uploads - moderate limits
  '/api/upload': {
    limit: 10,
    windowSeconds: 60,
    burstLimit: 3,
    perUser: true,
  },

  // Search/expensive operations - conservative limits
  '/api/search': {
    limit: 30,
    windowSeconds: 60,
    perUser: true,
    perIp: true,
  },

  // Webhooks - lenient limits
  '/api/webhooks/*': {
    limit: 1000,
    windowSeconds: 60,
    perIp: true,
  },

  // Entity-specific routes
  '/api/profiles': {
    limit: 100,
    windowSeconds: 60,
    burstLimit: 20,
    perUser: true,
  },
  '/api/clients': {
    limit: 100,
    windowSeconds: 60,
    burstLimit: 20,
    perUser: true,
  },
  '/api/services': {
    limit: 100,
    windowSeconds: 60,
    burstLimit: 20,
    perUser: true,
  },
  '/api/appointments': {
    limit: 100,
    windowSeconds: 60,
    burstLimit: 20,
    perUser: true,
  },
  '/api/availabilities': {
    limit: 100,
    windowSeconds: 60,
    burstLimit: 20,
    perUser: true,
  },
  '/api/documents': {
    limit: 100,
    windowSeconds: 60,
    burstLimit: 20,
    perUser: true,
  },
};

// ============================================================
// REDIS/UPSTASH CLIENT
// ============================================================

/**
 * Redis client interface for rate limiting storage.
 * Compatible with Upstash Redis or standard ioredis.
 */
export interface RedisClient {
  eval: <T>(
    script: string,
    keys: string[],
    args: (string | number)[]
  ) => Promise<T>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number }) => Promise<void>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<void>;
}

/**
 * In-memory fallback storage for development/testing.
 * NOT suitable for production or distributed systems.
 */
class InMemoryStorage {
  private store = new Map<string, { count: number; resetAt: number }>();
  private warningLogged = false;

  private logWarning(): void {
    if (!this.warningLogged) {
      logger.warn('Rate limiting using in-memory storage', {
        message: 'Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production',
        impact: 'Rate limits not shared across serverless instances',
      });
      this.warningLogged = true;
    }
  }

  async get(key: string): Promise<{ count: number; resetAt: number } | null> {
    this.logWarning();
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.resetAt) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  async increment(
    key: string,
    windowSeconds: number
  ): Promise<{ count: number; resetAt: number }> {
    this.logWarning();
    const now = Date.now();
    const existing = await this.get(key);

    if (existing) {
      existing.count += 1;
      this.store.set(key, existing);
      return existing;
    }

    const entry = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    };
    this.store.set(key, entry);
    return entry;
  }

  /** Clean up expired entries (call periodically) */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }
}

// ============================================================
// RATE LIMITER IMPLEMENTATION
// ============================================================

/**
 * Sliding window rate limiter using token bucket algorithm.
 */
export class RateLimiter {
  private redis: RedisClient | null = null;
  private inMemory: InMemoryStorage;
  private keyPrefix: string;

  constructor(options?: {
    redis?: RedisClient;
    keyPrefix?: string;
  }) {
    this.redis = options?.redis ?? null;
    this.inMemory = new InMemoryStorage();
    this.keyPrefix = options?.keyPrefix ?? 'ratelimit';
  }

  /**
   * Configure Redis client for distributed rate limiting.
   * Call this during app initialization.
   */
  setRedisClient(redis: RedisClient): void {
    this.redis = redis;
  }

  /**
   * Check rate limit for a given identifier and config.
   */
  async check(
    identifier: string,
    config: RateLimitConfig
  ): Promise<Result<RateLimitResult, RateLimitError>> {
    const key = `${this.keyPrefix}:${identifier}`;

    // Track that we're checking
    rateLimitMetrics.inc('checked');

    try {
      let result: Result<RateLimitResult, RateLimitError>;

      if (this.redis) {
        result = await this.checkWithRedis(key, config);
      } else {
        result = await this.checkWithMemory(key, config);
      }

      // Track outcome
      if (result.ok) {
        rateLimitMetrics.inc('allowed');
      } else if (result.error.code === 'rate_limited') {
        rateLimitMetrics.inc('blocked');
        logger.info('Rate limit exceeded', {
          identifier,
          limit: config.limit,
          windowSeconds: config.windowSeconds,
          retryAfter: result.error.retryAfter,
        });
      }

      return result;
    } catch (error) {
      rateLimitMetrics.inc('storage_error');
      logger.error('Rate limiter storage error', {
        identifier,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        ok: false,
        error: {
          code: 'storage_error',
          message: 'Failed to check rate limit',
        },
      };
    }
  }

  /**
   * Check rate limit using Redis with sliding window.
   */
  private async checkWithRedis(
    key: string,
    config: RateLimitConfig
  ): Promise<Result<RateLimitResult, RateLimitError>> {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const windowStart = now - windowMs;

    // Lua script for atomic sliding window rate limiting
    const luaScript = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local window_start = tonumber(ARGV[2])
      local window_ms = tonumber(ARGV[3])
      local limit = tonumber(ARGV[4])

      -- Remove old entries outside the window
      redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

      -- Count current entries
      local count = redis.call('ZCARD', key)

      if count < limit then
        -- Add new entry with current timestamp
        redis.call('ZADD', key, now, now .. '-' .. math.random())
        redis.call('PEXPIRE', key, window_ms)
        return {1, count + 1, limit}
      else
        -- Rate limited
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local reset_at = oldest[2] and (tonumber(oldest[2]) + window_ms) or (now + window_ms)
        return {0, count, limit, reset_at}
      end
    `;

    const result = await this.redis!.eval<number[]>(
      luaScript,
      [key],
      [now, windowStart, windowMs, config.limit]
    );

    const [allowed, count, limit, resetAt] = result;
    const reset = resetAt ?? now + windowMs;
    const retryAfter = Math.ceil((reset - now) / 1000);

    if (allowed === 1) {
      return {
        ok: true,
        value: {
          allowed: true,
          limit,
          remaining: limit - count,
          reset: Math.ceil(reset / 1000),
          retryAfter: 0,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'rate_limited',
        message: 'Too many requests',
        retryAfter,
      },
    };
  }

  /**
   * Check rate limit using in-memory storage (development fallback).
   */
  private async checkWithMemory(
    key: string,
    config: RateLimitConfig
  ): Promise<Result<RateLimitResult, RateLimitError>> {
    const { count, resetAt } = await this.inMemory.increment(
      key,
      config.windowSeconds
    );

    const now = Date.now();
    const retryAfter = Math.ceil((resetAt - now) / 1000);

    if (count <= config.limit) {
      return {
        ok: true,
        value: {
          allowed: true,
          limit: config.limit,
          remaining: config.limit - count,
          reset: Math.ceil(resetAt / 1000),
          retryAfter: 0,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'rate_limited',
        message: 'Too many requests',
        retryAfter,
      },
    };
  }
}

// ============================================================
// SINGLETON INSTANCE WITH AUTO-INITIALIZATION
// ============================================================

let rateLimiterInstance: RateLimiter | null = null;
let autoInitAttempted = false;

/**
 * Attempt to auto-initialize Upstash Redis from environment variables.
 * This is called automatically on first use.
 */
async function autoInitializeUpstash(): Promise<void> {
  if (autoInitAttempted) return;
  autoInitAttempted = true;

  if (!isUpstashConfigured()) {
    logger.debug('Upstash Redis not configured, using in-memory rate limiting', {
      hint: 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production',
    });
    return;
  }

  try {
    // Dynamic import to avoid bundling @upstash/redis if not used
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Test connection
    await redis.ping();

    // Configure rate limiter
    const limiter = getRateLimiter();
    limiter.setRedisClient({
      eval: redis.eval.bind(redis) as RedisClient['eval'],
      get: redis.get.bind(redis) as RedisClient['get'],
      set: async (key, value, opts) => {
        // Transform opts to Upstash format: only pass ex if defined
        const upstashOpts = opts?.ex ? { ex: opts.ex } : undefined;
        await redis.set(key, value, upstashOpts);
      },
      incr: redis.incr.bind(redis),
      expire: async (key, seconds) => {
        await redis.expire(key, seconds);
      },
    });

    logger.info('Rate limiter initialized with Upstash Redis', {
      url: process.env.UPSTASH_REDIS_REST_URL?.replace(/\/\/.*@/, '//***@'),
    });
  } catch (error) {
    logger.warn('Failed to initialize Upstash Redis for rate limiting', {
      error: error instanceof Error ? error.message : String(error),
      fallback: 'Using in-memory rate limiting',
    });
  }
}

/**
 * Get or create the rate limiter singleton.
 * Automatically attempts to initialize Upstash Redis from environment variables.
 */
export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

/**
 * Initialize the rate limiter.
 * Call this during app startup to enable Upstash Redis.
 * If not called, auto-initialization will occur on first rate limit check.
 */
export async function initializeRateLimiter(): Promise<void> {
  await autoInitializeUpstash();
}

/**
 * Configure the rate limiter with a custom Redis client.
 * Use this if you have a custom Redis setup instead of Upstash.
 *
 * @example
 * // With Upstash Redis
 * import { Redis } from '@upstash/redis';
 * configureRateLimiter(new Redis({ url: '...', token: '...' }));
 */
export function configureRateLimiter(redis: RedisClient): void {
  getRateLimiter().setRedisClient(redis);
  autoInitAttempted = true; // Prevent auto-init from overwriting
}

// ============================================================
// IDENTIFIER EXTRACTION
// ============================================================

/**
 * Get client IP address from request headers.
 * Handles common proxy headers (X-Forwarded-For, X-Real-IP).
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Vercel-specific header
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0]?.trim() ?? 'unknown';
  }

  // NextRequest.ip is not available in all environments
  return 'unknown';
}

/**
 * Get user ID from request (requires auth).
 * Returns null if not authenticated.
 */
export function getUserId(request: NextRequest): string | null {
  // Check for user ID header (set by auth middleware)
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return userId;
  }

  // Check authorization header for JWT (extract sub claim)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = JSON.parse(atob(token.split('.')[1]!));
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Build rate limit identifier based on config.
 */
export async function buildIdentifier(
  request: NextRequest,
  config: RateLimitConfig,
  routeKey: string
): Promise<string> {
  // Custom identifier function takes precedence
  if (config.getIdentifier) {
    const customId = await config.getIdentifier(request);
    return `${routeKey}:${customId}`;
  }

  const parts: string[] = [routeKey];

  if (config.perUser) {
    const userId = getUserId(request);
    if (userId) {
      parts.push(`user:${userId}`);
    }
  }

  if (config.perIp) {
    const ip = getClientIp(request);
    parts.push(`ip:${ip}`);
  }

  // Fallback to IP if no identifier
  if (parts.length === 1) {
    parts.push(`ip:${getClientIp(request)}`);
  }

  return parts.join(':');
}

// ============================================================
// ROUTE MATCHING
// ============================================================

/**
 * Find rate limit config for a given route.
 * Supports exact matches and glob patterns.
 */
export function getRouteConfig(
  pathname: string,
  tier?: RateLimitTier
): RateLimitConfig {
  // Check for exact match first
  if (pathname in ROUTE_RATE_LIMITS) {
    return ROUTE_RATE_LIMITS[pathname]!;
  }

  // Check for glob patterns (simple * matching)
  for (const [pattern, config] of Object.entries(ROUTE_RATE_LIMITS)) {
    if (pattern.includes('*')) {
      const regex = new RegExp(
        '^' + pattern.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$'
      );
      if (regex.test(pathname)) {
        return config;
      }
    }
  }

  // Fall back to tier default or 'api' tier
  return DEFAULT_RATE_LIMITS[tier ?? 'api'];
}

// ============================================================
// MAIN RATE LIMIT FUNCTION
// ============================================================

/**
 * Check rate limit for an incoming request.
 *
 * @example
 * const result = await rateLimit(request, 'api');
 * if (!result.ok) {
 *   return new Response('Too Many Requests', {
 *     status: 429,
 *     headers: rateLimitHeaders(result.error),
 *   });
 * }
 */
export async function rateLimit(
  request: NextRequest,
  tier?: RateLimitTier,
  configOverride?: Partial<RateLimitConfig>
): Promise<Result<RateLimitResult, RateLimitError>> {
  // Skip if rate limiting is disabled
  if (!isRateLimitEnabled()) {
    return {
      ok: true,
      value: {
        allowed: true,
        limit: Infinity,
        remaining: Infinity,
        reset: 0,
        retryAfter: 0,
      },
    };
  }

  // Auto-initialize Upstash on first use
  await autoInitializeUpstash();

  const pathname = request.nextUrl.pathname;
  const baseConfig = getRouteConfig(pathname, tier);
  const config: RateLimitConfig = { ...baseConfig, ...configOverride };

  const routeKey = pathname.replace(/\//g, ':').replace(/^:/, '');
  const identifier = await buildIdentifier(request, config, routeKey);

  return getRateLimiter().check(identifier, config);
}

// ============================================================
// RATE LIMIT HEADERS
// ============================================================

/**
 * Generate standard rate limit headers.
 */
export function rateLimitHeaders(
  result: RateLimitResult | RateLimitError
): Record<string, string> {
  if ('allowed' in result) {
    // Success result
    return {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.reset),
      'X-RateLimit-Policy': `${result.limit};w=${Math.ceil(result.reset - Date.now() / 1000)}`,
    };
  }

  // Error result
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': '0',
    'X-RateLimit-Remaining': '0',
  };

  if (result.retryAfter) {
    headers['Retry-After'] = String(result.retryAfter);
    headers['X-RateLimit-Reset'] = String(
      Math.ceil(Date.now() / 1000) + result.retryAfter
    );
  }

  return headers;
}

/**
 * Apply rate limit headers to a response.
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult | RateLimitError
): NextResponse {
  const headers = rateLimitHeaders(result);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// ============================================================
// MIDDLEWARE HELPER
// ============================================================

/**
 * Type for Next.js API route handler.
 */
export type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<Response> | Response;

/**
 * Wrap a route handler with rate limiting.
 *
 * @example
 * export const GET = withRateLimit(async (request) => {
 *   return Response.json({ data: '...' });
 * }, 'api');
 */
export function withRateLimit(
  handler: RouteHandler,
  tier?: RateLimitTier,
  configOverride?: Partial<RateLimitConfig>
): RouteHandler {
  return async (request, context) => {
    const result = await rateLimit(request, tier, configOverride);

    if (!result.ok) {
      const headers = rateLimitHeaders(result.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            type: 'rate_limited',
            message: result.error.message,
            retryAfter: result.error.retryAfter,
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        }
      );
    }

    // Call the actual handler
    const response = await handler(request, context);

    // Add rate limit headers to successful response
    const headers = rateLimitHeaders(result.value);
    const newHeaders = new Headers(response.headers);
    Object.entries(headers).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

// ============================================================
// MIDDLEWARE INTEGRATION
// ============================================================

/**
 * Rate limiting middleware for Next.js.
 * Use this in middleware.ts for global rate limiting.
 *
 * @example
 * // middleware.ts
 * import { rateLimitMiddleware } from '@/lib/rate-limit';
 *
 * export async function middleware(request: NextRequest) {
 *   const rateLimitResult = await rateLimitMiddleware(request);
 *   if (rateLimitResult) {
 *     return rateLimitResult; // Returns 429 response
 *   }
 *
 *   // Continue with other middleware logic
 *   return NextResponse.next();
 * }
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  tier?: RateLimitTier
): Promise<NextResponse | null> {
  // Skip rate limiting for static assets
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return null;
  }

  // Only rate limit API routes by default
  if (!pathname.startsWith('/api')) {
    return null;
  }

  const result = await rateLimit(request, tier);

  if (!result.ok) {
    const headers = rateLimitHeaders(result.error);
    const response = NextResponse.json(
      {
        success: false,
        error: {
          type: 'rate_limited',
          message: 'Too many requests. Please try again later.',
          retryAfter: result.error.retryAfter,
        },
      },
      { status: 429 }
    );

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  return null;
}

// ============================================================
// UPSTASH REDIS INTEGRATION
// ============================================================

/**
 * Create rate limiter with Upstash Redis.
 * Requires @upstash/redis package.
 *
 * @example
 * import { Redis } from '@upstash/redis';
 *
 * const redis = new Redis({
 *   url: process.env.UPSTASH_REDIS_REST_URL!,
 *   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
 * });
 *
 * const limiter = createUpstashRateLimiter(redis);
 */
export function createUpstashRateLimiter(
  redis: {
    eval: <T>(script: string, keys: string[], args: (string | number)[]) => Promise<T>;
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, options?: { ex?: number }) => Promise<unknown>;
    incr: (key: string) => Promise<number>;
    expire: (key: string, seconds: number) => Promise<unknown>;
  },
  options?: { keyPrefix?: string }
): RateLimiter {
  const limiter = new RateLimiter({
    keyPrefix: options?.keyPrefix ?? 'ratelimit',
  });

  // Adapt Upstash Redis to our interface
  const redisAdapter: RedisClient = {
    eval: redis.eval.bind(redis),
    get: redis.get.bind(redis),
    set: async (key, value, opts) => {
      // Transform opts to Upstash format: only pass ex if defined
      const upstashOpts = opts?.ex ? { ex: opts.ex } : undefined;
      await redis.set(key, value, upstashOpts);
    },
    incr: redis.incr.bind(redis),
    expire: async (key, seconds) => {
      await redis.expire(key, seconds);
    },
  };

  limiter.setRedisClient(redisAdapter);
  return limiter;
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// All types are exported at their definitions above
// ============================================================
