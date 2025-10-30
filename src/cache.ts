/**
 * In-memory cache för API-data
 */

import { log } from './logger.js';
import { CacheError } from './errors.js';

interface CacheEntry<T> {
  data: T;
  expires: number;
}

export class Cache {
  private store = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;

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
  set<T>(key: string, data: T, ttl: number = 3600000): void {
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
    ttl: number = 3600000
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

// Rensa utgångna entries varje 5 minut
setInterval(() => {
  cache.prune();
}, 5 * 60 * 1000);

export default cache;
