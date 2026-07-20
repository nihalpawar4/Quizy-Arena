/**
 * Firebase Cache Layer
 *
 * In-memory cache with TTL and selective invalidation.
 * Prevents redundant Firestore reads across the app.
 *
 * Cache key convention:
 *   - Documents: "collection:docId"
 *   - Queries:   "collection:query:hash"
 *   - Sub-collections: "parent:parentId:sub:query"
 */

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 500;

class FirebaseCache {
  private store = new Map<string, CacheEntry>();

  /**
   * Get a cached value. Returns undefined if expired or missing.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Set a value in cache with optional TTL.
   */
  set<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
    // Evict oldest entries if over capacity
    if (this.store.size >= MAX_ENTRIES) {
      this.evictOldest();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate a specific cache key.
   */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix.
   * Example: invalidatePrefix("users:") clears all user documents.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Invalidate all entries in the cache.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Check if a key exists and is not expired.
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Get the current cache size.
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Build a cache key for a document.
   */
  static docKey(collection: string, docId: string): string {
    return `${collection}:${docId}`;
  }

  /**
   * Build a cache key for a subcollection document.
   */
  static subDocKey(
    parentCollection: string,
    parentId: string,
    subCollection: string,
    docId: string,
  ): string {
    return `${parentCollection}:${parentId}:${subCollection}:${docId}`;
  }

  /**
   * Build a cache key for a query (uses stringified constraints).
   */
  static queryKey(collection: string, constraintHash: string): string {
    return `${collection}:q:${constraintHash}`;
  }

  /**
   * Evict the oldest ~10% of entries.
   */
  private evictOldest(): void {
    const entries = Array.from(this.store.entries());
    // Sort by expiration (oldest first)
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);

    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      this.store.delete(entries[i][0]);
    }
  }
}

/**
 * Singleton cache instance used across the app.
 */
export const firebaseCache = new FirebaseCache();
