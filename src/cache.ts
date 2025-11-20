/**
 * In-memory cache för API-data
 */

import { log } from './logger.js';
import { CacheError } from './errors.js';
import { CACHE_DEFAULTS } from './constants.js';
import crypto from 'crypto';

interface CacheEntry<T> {
  data: T;
  expires: number;
  lastAccessed: number;
  size: number;
}

export class Cache {
  private store = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private pruneInterval?: NodeJS.Timeout;
  private readonly maxSize: number;

  constructor(maxSize: number = CACHE_DEFAULTS.MAX_CACHE_SIZE) {
    this.maxSize = maxSize;
  }

  /**
   * Generera säker cache-nyckel från sträng
   */
  private generateKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Beräkna storlek på data (approximation i bytes)
   */
  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  /**
   * Evict äldsta entries om cache är full
   */
  private evictIfNeeded(): void {
    if (this.store.size < this.maxSize) return;

    // Hitta äldsta entry baserat på lastAccessed
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
      this.evictions++;
      log.debug('Cache evicted oldest entry', { key: oldestKey, evictions: this.evictions });
    }
  }

  /**
   * Hämta data från cache
   */
  get<T>(key: string): T | null {
    const hashedKey = this.generateKey(key);
    const entry = this.store.get(hashedKey);

    if (!entry) {
      this.misses++;
      log.debug('Cache miss', { key });
      return null;
    }

    // Kolla om expired
    if (entry.expires < Date.now()) {
      this.store.delete(hashedKey);
      this.misses++;
      log.debug('Cache expired', { key });
      return null;
    }

    // Uppdatera lastAccessed
    entry.lastAccessed = Date.now();
    this.hits++;
    log.debug('Cache hit', { key });
    return entry.data as T;
  }

  /**
   * Sätt data i cache
   */
  set<T>(key: string, data: T, ttl: number = CACHE_DEFAULTS.DEFAULT_TTL_MS): void {
    this.evictIfNeeded();

    const hashedKey = this.generateKey(key);
    const expires = Date.now() + ttl;
    const size = this.estimateSize(data);
    const lastAccessed = Date.now();

    this.store.set(hashedKey, { data, expires, lastAccessed, size });
    log.debug('Cache set', { key, ttl, expires, size });
  }

  /**
   * Ta bort specifik nyckel från cache
   */
  delete(key: string): boolean {
    const hashedKey = this.generateKey(key);
    const deleted = this.store.delete(hashedKey);
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
  startAutoPrune(intervalMs: number = CACHE_DEFAULTS.PRUNE_INTERVAL_MS): void {
    if (this.pruneInterval) {
      log.warn('Auto-prune already running');
      return;
    }

    this.pruneInterval = setInterval(() => {
      // Använd setImmediate för att inte blockera event loop
      setImmediate(() => this.prune());
    }, intervalMs);

    log.info('Auto-prune started', { intervalMs, maxSize: this.maxSize });
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
    let totalSize = 0;
    for (const entry of this.store.values()) {
      totalSize += entry.size;
    }

    return {
      size: this.store.size,
      maxSize: this.maxSize,
      totalSizeBytes: totalSize,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: this.hits + this.misses > 0
        ? (this.hits / (this.hits + this.misses) * 100).toFixed(2) + '%'
        : '0%',
      utilizationRate: ((this.store.size / this.maxSize) * 100).toFixed(2) + '%'
    };
  }

  /**
   * Kör en funktion med caching
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CACHE_DEFAULTS.DEFAULT_TTL_MS
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

  /**
   * Invalida cache entries som matchar ett prefix eller pattern
   */
  invalidatePattern(pattern: string): number {
    let invalidated = 0;
    for (const [key] of this.store.entries()) {
      if (key.includes(pattern)) {
        this.store.delete(key);
        invalidated++;
      }
    }

    if (invalidated > 0) {
      log.info('Cache pattern invalidated', { pattern, invalidated });
    }

    return invalidated;
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
