/**
 * Simple in-memory cache with TTL support
 * Improves performance by caching API responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get cached value if still valid
   * @param key Cache key
   * @returns Cached value or undefined if expired/missing
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if cache entry has expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Set cache value with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear specific cache entry
   * @param key Cache key to clear
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Create singleton cache instance
export const cache = new SimpleCache();

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  // Support data changes rarely - cache for 24 hours
  SUPPORT_DATA: 24 * 60 * 60 * 1000, // 24h

  // Statistics updates periodically - cache for 1 hour
  STATISTICS: 60 * 60 * 1000, // 1h

  // School units can change - cache for 30 minutes
  SCHOOL_UNITS: 30 * 60 * 1000, // 30min

  // Surveys update less frequently - cache for 4 hours
  SURVEYS: 4 * 60 * 60 * 1000, // 4h

  // Education events can change - cache for 1 hour
  EDUCATION_EVENTS: 60 * 60 * 1000, // 1h

  // Läroplan API data is very stable - cache for 24 hours
  SYLLABUS: 24 * 60 * 60 * 1000 // 24h
};

/**
 * Generate cache key from function name and parameters
 */
export function generateCacheKey(prefix: string, params: any): string {
  // Sort and stringify parameters for consistent keys
  const sortedParams = Object.keys(params || {})
    .sort()
    .reduce((obj: any, key) => {
      obj[key] = params[key];
      return obj;
    }, {});

  return `${prefix}:${JSON.stringify(sortedParams)}`;
}

/**
 * Wrapper function to add caching to async functions
 */
export async function withCache<T>(
  cacheKey: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  cache.set(cacheKey, result, ttl);
  return result;
}

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  const removed = cache.cleanup();
  if (removed > 0) {
    console.log(`[Cache] Cleaned up ${removed} expired entries`);
  }
}, 5 * 60 * 1000);
