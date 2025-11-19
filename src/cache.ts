/**
 * In-memory cache för API-data
 */

import { log } from './logger.js';
import { CacheError } from './errors.js';

// Constants
const DEFAULT_CACHE_TTL_MS = 3600000; // 1 hour
const DEFAULT_PRUNE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  expires: number;
}

export class Cache {
  private store = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private pruneInterval?: NodeJS.Timeout;

  /**
   * Hämta data från cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      log.debug('Cache miss', { key });
      return null;
    }

    // Kolla om expired
    if (entry.expires < Date.now()) {
      this.store.delete(key);
      this.misses++;
      log.debug('Cache expired', { key });
      return null;
    }

    this.hits++;
    log.debug('Cache hit', { key });
    return entry.data as T;
  }

  /**
   * Sätt data i cache
   */
  set<T>(key: string, data: T, ttl: number = DEFAULT_CACHE_TTL_MS): void {
    const expires = Date.now() + ttl;
    this.store.set(key, { data, expires });
    log.debug('Cache set', { key, ttl, expires });
  }

  /**
   * Ta bort specifik nyckel från cache
   */
  delete(key: string): boolean {
    const deleted = this.store.delete(key);
    if (deleted) {
      log.debug('Cache deleted', { key });
    }
    return deleted;
  }

  /**
   * Rensa hela cachen
   */
  clear(): void {
    const size = this.store.size;
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
    log.info('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Starta auto-prune interval
   */
  startAutoPrune(intervalMs: number = DEFAULT_PRUNE_INTERVAL_MS): void {
    if (this.pruneInterval) {
      log.warn('Auto-prune already running');
      return;
    }

    this.pruneInterval = setInterval(() => {
      this.prune();
    }, intervalMs);

    log.info('Auto-prune started', { intervalMs });
  }

  /**
   * Stoppa auto-prune interval
   */
  stopAutoPrune(): void {
    if (this.pruneInterval) {
      clearInterval(this.pruneInterval);
      this.pruneInterval = undefined;
      log.info('Auto-prune stopped');
    }
  }

  /**
   * Rensa utgångna entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.expires < now) {
        this.store.delete(key);
        pruned++;
      }
    }

    if (pruned > 0) {
      log.info('Cache pruned', { entriesRemoved: pruned });
    }

    return pruned;
  }

  /**
   * Hämta cache-statistik
   */
  getStats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? (this.hits / (this.hits + this.misses) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Kör en funktion med caching
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = DEFAULT_CACHE_TTL_MS
  ): Promise<T> {
    // Försök hämta från cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch och cache
    try {
      const data = await fetchFn();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      log.error('Cache fetch failed', { key, error });
      throw new CacheError(`Failed to fetch data for key: ${key}`);
    }
  }
}

// Singleton cache instance
export const cache = new Cache();

// Starta auto-prune
cache.startAutoPrune();

// Cleanup vid process exit
process.on('exit', () => {
  cache.stopAutoPrune();
});

process.on('SIGTERM', () => {
  cache.stopAutoPrune();
});

process.on('SIGINT', () => {
  cache.stopAutoPrune();
});

export default cache;
