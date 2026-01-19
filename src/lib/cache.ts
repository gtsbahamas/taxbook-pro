/**
 * Caching Library - taxbook-pro
 * Generated: 2026-01-19
 *
 * Application-level caching with Redis/Upstash support for distributed systems.
 * Implements multiple caching strategies with automatic invalidation.
 *
 * Features:
 * - Multiple cache strategies (read-through, write-through, cache-aside)
 * - Stale-while-revalidate pattern
 * - Automatic cache key generation
 * - Redis/Upstash integration for distributed caching
 * - In-memory fallback for development
 * - Cache invalidation by key, pattern, or tag
 *
 * Usage:
 *   import { cache, invalidateCache } from '@/lib/cache';
 *
 *   // Cache-aside pattern
 *   const user = await cache.get('user:123', async () => {
 *     return await db.users.findUnique({ where: { id: '123' } });
 *   }, { ttl: 300 });
 *
 *   // Invalidate on update
 *   await invalidateCache('user:123');
 */

import type { Result } from '@/types/errors';

// ============================================================
// SCALABILITY PATTERNS (Second-Order Mental Model)
// ============================================================
//
// What happens at 10x users?
//   → Database becomes bottleneck for read-heavy operations
//   → Solution: Cache frequently accessed data
//
// What happens at 100x users?
//   → Single server cache causes memory pressure
//   → Solution: Redis for distributed caching
//
// What cascades from stale cache?
//   → Users see outdated data → Trust erosion
//   → Solution: Short TTLs + stale-while-revalidate
//
// What becomes harder to change?
//   → Cache keys become implicit contracts
//   → Solution: Centralized key generation + tagged invalidation
//
// Second-Order Insights Applied:
//   • Easy booking → more clients → need capacity management
//   • Document collection → less back-and-forth → faster appointments
//   • Tax season mode → prevents burnout → sustainable practice
// ============================================================

// ============================================================
// CACHE CONFIGURATION TYPES
// ============================================================

/**
 * Cache entry with metadata.
 */
export interface CacheEntry<T> {
  /** Cached value */
  readonly value: T;
  /** When the entry was created (Unix timestamp) */
  readonly createdAt: number;
  /** When the entry expires (Unix timestamp) */
  readonly expiresAt: number;
  /** Tags for grouped invalidation */
  readonly tags?: readonly string[];
  /** Whether this entry is stale but still usable */
  readonly stale?: boolean;
}

/**
 * Options for cache operations.
 */
export interface CacheOptions {
  /** Time-to-live in seconds (default: 300) */
  readonly ttl?: number;
  /** Stale time in seconds - entry is stale but usable (default: ttl * 0.5) */
  readonly staleTime?: number;
  /** Tags for grouped invalidation */
  readonly tags?: readonly string[];
  /** Skip cache and force fresh fetch */
  readonly skipCache?: boolean;
  /** Force refresh even if cached value exists */
  readonly forceRefresh?: boolean;
}

/**
 * Cache statistics for monitoring.
 */
export interface CacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly staleHits: number;
  readonly errors: number;
  readonly hitRate: number;
}

/**
 * Cache error types.
 */
export type CacheErrorCode =
  | 'serialization_error'
  | 'storage_error'
  | 'fetch_error'
  | 'invalidation_error'
  | 'unknown';

export interface CacheError {
  readonly code: CacheErrorCode;
  readonly message: string;
  readonly key?: string;
}

// ============================================================
// REDIS CLIENT INTERFACE
// ============================================================

/**
 * Redis client interface for cache storage.
 * Compatible with Upstash Redis or standard ioredis.
 */
export interface RedisClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number }) => Promise<void>;
  del: (key: string) => Promise<void>;
  keys: (pattern: string) => Promise<string[]>;
  mget: (keys: string[]) => Promise<(string | null)[]>;
  expire: (key: string, seconds: number) => Promise<void>;
  ttl: (key: string) => Promise<number>;
  sadd: (key: string, ...members: string[]) => Promise<number>;
  smembers: (key: string) => Promise<string[]>;
  srem: (key: string, ...members: string[]) => Promise<number>;
}

// ============================================================
// IN-MEMORY FALLBACK STORAGE
// ============================================================

/**
 * In-memory cache storage for development/testing.
 * NOT suitable for production or distributed systems.
 */
class InMemoryCache {
  private store = new Map<string, { value: string; expiresAt: number }>();
  private tags = new Map<string, Set<string>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, options?: { ex?: number }): Promise<void> {
    const ttl = options?.ex ?? 300;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return Array.from(this.store.keys()).filter((key) => regex.test(key));
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map((key) => this.get(key)));
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -1;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    let set = this.tags.get(key);
    if (!set) {
      set = new Set();
      this.tags.set(key, set);
    }
    let added = 0;
    for (const member of members) {
      if (!set.has(member)) {
        set.add(member);
        added++;
      }
    }
    return added;
  }

  async smembers(key: string): Promise<string[]> {
    return Array.from(this.tags.get(key) ?? []);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = this.tags.get(key);
    if (!set) return 0;
    let removed = 0;
    for (const member of members) {
      if (set.delete(member)) removed++;
    }
    return removed;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// ============================================================
// CACHE IMPLEMENTATION
// ============================================================

/**
 * Application cache with multiple strategies.
 */
export class Cache {
  private redis: RedisClient | null = null;
  private inMemory: InMemoryCache;
  private keyPrefix: string;
  private stats: {
    hits: number;
    misses: number;
    staleHits: number;
    errors: number;
  };

  constructor(options?: { redis?: RedisClient; keyPrefix?: string }) {
    this.redis = options?.redis ?? null;
    this.inMemory = new InMemoryCache();
    this.keyPrefix = options?.keyPrefix ?? 'cache';
    this.stats = { hits: 0, misses: 0, staleHits: 0, errors: 0 };
  }

  /**
   * Configure Redis client for distributed caching.
   */
  setRedisClient(redis: RedisClient): void {
    this.redis = redis;
  }

  /**
   * Get storage client (Redis or in-memory fallback).
   */
  private getStorage(): RedisClient {
    return this.redis ?? (this.inMemory as unknown as RedisClient);
  }

  /**
   * Build full cache key with prefix.
   */
  private buildKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  /**
   * Get value from cache with optional fetcher (cache-aside pattern).
   *
   * @example
   * const user = await cache.get('user:123', async () => {
   *   return await db.users.findUnique({ where: { id: '123' } });
   * }, { ttl: 300, tags: ['users'] });
   */
  async get<T>(
    key: string,
    fetcher?: () => Promise<T>,
    options?: CacheOptions
  ): Promise<Result<T | null, CacheError>> {
    const fullKey = this.buildKey(key);
    const storage = this.getStorage();

    // Skip cache if requested
    if (options?.skipCache && fetcher) {
      try {
        const value = await fetcher();
        return { ok: true, value };
      } catch (error) {
        this.stats.errors++;
        return {
          ok: false,
          error: {
            code: 'fetch_error',
            message: error instanceof Error ? error.message : 'Fetch failed',
            key,
          },
        };
      }
    }

    try {
      // Try to get from cache
      const cached = await storage.get(fullKey);

      if (cached && !options?.forceRefresh) {
        const entry: CacheEntry<T> = JSON.parse(cached);
        const now = Date.now();

        // Check if still fresh
        if (now < entry.expiresAt) {
          this.stats.hits++;
          return { ok: true, value: entry.value };
        }

        // Check if stale but usable (stale-while-revalidate)
        const staleTime = options?.staleTime ?? (options?.ttl ?? 300) * 0.5;
        const staleUntil = entry.expiresAt + staleTime * 1000;

        if (now < staleUntil && fetcher) {
          this.stats.staleHits++;
          // Return stale value immediately, refresh in background
          this.refreshInBackground(key, fetcher, options);
          return { ok: true, value: entry.value };
        }
      }

      // Cache miss - fetch if fetcher provided
      this.stats.misses++;

      if (!fetcher) {
        return { ok: true, value: null };
      }

      const value = await fetcher();
      await this.set(key, value, options);
      return { ok: true, value };
    } catch (error) {
      this.stats.errors++;
      console.error('[Cache] Get error:', key, error);

      // If cache fails but fetcher exists, try fetcher directly
      if (fetcher) {
        try {
          const value = await fetcher();
          return { ok: true, value };
        } catch (fetchError) {
          return {
            ok: false,
            error: {
              code: 'fetch_error',
              message:
                fetchError instanceof Error
                  ? fetchError.message
                  : 'Fetch failed',
              key,
            },
          };
        }
      }

      return {
        ok: false,
        error: {
          code: 'storage_error',
          message: error instanceof Error ? error.message : 'Cache get failed',
          key,
        },
      };
    }
  }

  /**
   * Set value in cache.
   */
  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<Result<void, CacheError>> {
    const fullKey = this.buildKey(key);
    const storage = this.getStorage();
    const ttl = options?.ttl ?? 300;

    try {
      const entry: CacheEntry<T> = {
        value,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttl * 1000,
        tags: options?.tags,
      };

      await storage.set(fullKey, JSON.stringify(entry), { ex: ttl });

      // Track tags for invalidation
      if (options?.tags?.length) {
        for (const tag of options.tags) {
          await storage.sadd(`${this.keyPrefix}:tag:${tag}`, fullKey);
        }
      }

      return { ok: true, value: undefined };
    } catch (error) {
      this.stats.errors++;
      console.error('[Cache] Set error:', key, error);
      return {
        ok: false,
        error: {
          code: 'storage_error',
          message: error instanceof Error ? error.message : 'Cache set failed',
          key,
        },
      };
    }
  }

  /**
   * Delete value from cache.
   */
  async delete(key: string): Promise<Result<void, CacheError>> {
    const fullKey = this.buildKey(key);
    const storage = this.getStorage();

    try {
      await storage.del(fullKey);
      return { ok: true, value: undefined };
    } catch (error) {
      this.stats.errors++;
      return {
        ok: false,
        error: {
          code: 'invalidation_error',
          message:
            error instanceof Error ? error.message : 'Cache delete failed',
          key,
        },
      };
    }
  }

  /**
   * Invalidate cache entries by pattern.
   *
   * @example
   * // Invalidate all user cache entries
   * await cache.invalidatePattern('user:*');
   */
  async invalidatePattern(pattern: string): Promise<Result<number, CacheError>> {
    const fullPattern = this.buildKey(pattern);
    const storage = this.getStorage();

    try {
      const keys = await storage.keys(fullPattern);
      for (const key of keys) {
        await storage.del(key);
      }
      return { ok: true, value: keys.length };
    } catch (error) {
      this.stats.errors++;
      return {
        ok: false,
        error: {
          code: 'invalidation_error',
          message:
            error instanceof Error
              ? error.message
              : 'Pattern invalidation failed',
        },
      };
    }
  }

  /**
   * Invalidate cache entries by tag.
   *
   * @example
   * // Invalidate all entries tagged with 'users'
   * await cache.invalidateTag('users');
   */
  async invalidateTag(tag: string): Promise<Result<number, CacheError>> {
    const storage = this.getStorage();
    const tagKey = `${this.keyPrefix}:tag:${tag}`;

    try {
      const keys = await storage.smembers(tagKey);
      for (const key of keys) {
        await storage.del(key);
      }
      await storage.del(tagKey);
      return { ok: true, value: keys.length };
    } catch (error) {
      this.stats.errors++;
      return {
        ok: false,
        error: {
          code: 'invalidation_error',
          message:
            error instanceof Error ? error.message : 'Tag invalidation failed',
        },
      };
    }
  }

  /**
   * Refresh cache in background (stale-while-revalidate).
   */
  private refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): void {
    // Fire and forget - don't await
    fetcher()
      .then((value) => this.set(key, value, options))
      .catch((error) => {
        console.error('[Cache] Background refresh failed:', key, error);
      });
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Clear all cache entries.
   */
  async clear(): Promise<Result<void, CacheError>> {
    try {
      const storage = this.getStorage();
      const keys = await storage.keys(`${this.keyPrefix}:*`);
      for (const key of keys) {
        await storage.del(key);
      }
      return { ok: true, value: undefined };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'invalidation_error',
          message: error instanceof Error ? error.message : 'Cache clear failed',
        },
      };
    }
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let cacheInstance: Cache | null = null;

/**
 * Get or create the cache singleton.
 */
export function getCache(): Cache {
  if (!cacheInstance) {
    cacheInstance = new Cache();
  }
  return cacheInstance;
}

/**
 * Configure the cache with a Redis client.
 * Call this during app initialization for distributed caching.
 *
 * @example
 * import { Redis } from '@upstash/redis';
 * configureCache(new Redis({ url: '...', token: '...' }));
 */
export function configureCache(redis: RedisClient): void {
  getCache().setRedisClient(redis);
}

// ============================================================
// CONVENIENCE EXPORTS
// ============================================================

/**
 * Global cache instance for convenience.
 */
export const cache = {
  /**
   * Get value from cache with optional fetcher.
   */
  get: <T>(key: string, fetcher?: () => Promise<T>, options?: CacheOptions) =>
    getCache().get(key, fetcher, options),

  /**
   * Set value in cache.
   */
  set: <T>(key: string, value: T, options?: CacheOptions) =>
    getCache().set(key, value, options),

  /**
   * Delete value from cache.
   */
  delete: (key: string) => getCache().delete(key),

  /**
   * Invalidate by pattern.
   */
  invalidatePattern: (pattern: string) => getCache().invalidatePattern(pattern),

  /**
   * Invalidate by tag.
   */
  invalidateTag: (tag: string) => getCache().invalidateTag(tag),

  /**
   * Get statistics.
   */
  stats: () => getCache().getStats(),

  /**
   * Clear all entries.
   */
  clear: () => getCache().clear(),
};

/**
 * Invalidate a cache key.
 */
export async function invalidateCache(key: string): Promise<void> {
  await getCache().delete(key);
}

/**
 * Invalidate cache entries by pattern.
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  await getCache().invalidatePattern(pattern);
}

/**
 * Invalidate cache entries by tag.
 */
export async function invalidateCacheTag(tag: string): Promise<void> {
  await getCache().invalidateTag(tag);
}

// ============================================================
// CACHE KEY GENERATORS
// ============================================================

/**
 * Generate cache key for entity by ID.
 */
export function entityCacheKey(entity: string, id: string): string {
  return `${entity}:${id}`;
}

/**
 * Generate cache key for entity list with filters.
 */
export function listCacheKey(
  entity: string,
  filters?: Record<string, unknown>
): string {
  if (!filters || Object.keys(filters).length === 0) {
    return `${entity}:list`;
  }
  const sortedFilters = Object.keys(filters)
    .sort()
    .map((k) => `${k}=${JSON.stringify(filters[k])}`)
    .join('&');
  return `${entity}:list:${sortedFilters}`;
}

/**
 * Generate cache key for user-specific data.
 */
export function userCacheKey(userId: string, key: string): string {
  return `user:${userId}:${key}`;
}

// ============================================================
// ENTITY-SPECIFIC CACHE HELPERS
// ============================================================

/**
 * Cache helpers for Profile.
 */
export const profileCache = {
  /**
   * Get profile by ID with caching.
   */
  key: (id: string) => entityCacheKey('profile', id),

  /**
   * Get profile list cache key.
   */
  listKey: (filters?: Record<string, unknown>) =>
    listCacheKey('profile', filters),

  /**
   * Invalidate all profile cache entries.
   */
  invalidateAll: () => invalidateCachePattern('profile:*'),

  /**
   * Invalidate specific profile.
   */
  invalidate: (id: string) => invalidateCache(entityCacheKey('profile', id)),
};

/**
 * Cache helpers for Client.
 */
export const clientCache = {
  /**
   * Get client by ID with caching.
   */
  key: (id: string) => entityCacheKey('client', id),

  /**
   * Get client list cache key.
   */
  listKey: (filters?: Record<string, unknown>) =>
    listCacheKey('client', filters),

  /**
   * Invalidate all client cache entries.
   */
  invalidateAll: () => invalidateCachePattern('client:*'),

  /**
   * Invalidate specific client.
   */
  invalidate: (id: string) => invalidateCache(entityCacheKey('client', id)),
};

/**
 * Cache helpers for Service.
 */
export const serviceCache = {
  /**
   * Get service by ID with caching.
   */
  key: (id: string) => entityCacheKey('service', id),

  /**
   * Get service list cache key.
   */
  listKey: (filters?: Record<string, unknown>) =>
    listCacheKey('service', filters),

  /**
   * Invalidate all service cache entries.
   */
  invalidateAll: () => invalidateCachePattern('service:*'),

  /**
   * Invalidate specific service.
   */
  invalidate: (id: string) => invalidateCache(entityCacheKey('service', id)),
};

/**
 * Cache helpers for Appointment.
 */
export const appointmentCache = {
  /**
   * Get appointment by ID with caching.
   */
  key: (id: string) => entityCacheKey('appointment', id),

  /**
   * Get appointment list cache key.
   */
  listKey: (filters?: Record<string, unknown>) =>
    listCacheKey('appointment', filters),

  /**
   * Invalidate all appointment cache entries.
   */
  invalidateAll: () => invalidateCachePattern('appointment:*'),

  /**
   * Invalidate specific appointment.
   */
  invalidate: (id: string) => invalidateCache(entityCacheKey('appointment', id)),
};

/**
 * Cache helpers for Availability.
 */
export const availabilityCache = {
  /**
   * Get availability by ID with caching.
   */
  key: (id: string) => entityCacheKey('availability', id),

  /**
   * Get availability list cache key.
   */
  listKey: (filters?: Record<string, unknown>) =>
    listCacheKey('availability', filters),

  /**
   * Invalidate all availability cache entries.
   */
  invalidateAll: () => invalidateCachePattern('availability:*'),

  /**
   * Invalidate specific availability.
   */
  invalidate: (id: string) => invalidateCache(entityCacheKey('availability', id)),
};

/**
 * Cache helpers for Document.
 */
export const documentCache = {
  /**
   * Get document by ID with caching.
   */
  key: (id: string) => entityCacheKey('document', id),

  /**
   * Get document list cache key.
   */
  listKey: (filters?: Record<string, unknown>) =>
    listCacheKey('document', filters),

  /**
   * Invalidate all document cache entries.
   */
  invalidateAll: () => invalidateCachePattern('document:*'),

  /**
   * Invalidate specific document.
   */
  invalidate: (id: string) => invalidateCache(entityCacheKey('document', id)),
};

// ============================================================
// UPSTASH REDIS INTEGRATION
// ============================================================

/**
 * Create cache with Upstash Redis.
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
 * const appCache = createUpstashCache(redis);
 */
export function createUpstashCache(
  redis: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, options?: { ex?: number }) => Promise<unknown>;
    del: (key: string) => Promise<unknown>;
    keys: (pattern: string) => Promise<string[]>;
    mget: (...keys: string[]) => Promise<(string | null)[]>;
    expire: (key: string, seconds: number) => Promise<unknown>;
    ttl: (key: string) => Promise<number>;
    sadd: (key: string, ...members: string[]) => Promise<number>;
    smembers: (key: string) => Promise<string[]>;
    srem: (key: string, ...members: string[]) => Promise<number>;
  },
  options?: { keyPrefix?: string }
): Cache {
  const cache = new Cache({ keyPrefix: options?.keyPrefix ?? 'cache' });

  // Adapt Upstash Redis to our interface
  const redisAdapter: RedisClient = {
    get: redis.get.bind(redis),
    set: async (key, value, opts) => {
      await redis.set(key, value, opts);
    },
    del: async (key) => {
      await redis.del(key);
    },
    keys: redis.keys.bind(redis),
    mget: (keys) => redis.mget(...keys),
    expire: async (key, seconds) => {
      await redis.expire(key, seconds);
    },
    ttl: redis.ttl.bind(redis),
    sadd: redis.sadd.bind(redis),
    smembers: redis.smembers.bind(redis),
    srem: redis.srem.bind(redis),
  };

  cache.setRedisClient(redisAdapter);
  return cache;
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// All types are exported at their definitions above
// ============================================================
