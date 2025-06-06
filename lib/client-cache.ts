/**
 * Client-side cache utility
 */

// Cache storage
type CacheEntry<T> = {
  value: T
  timestamp: number
  ttl: number
}

class ClientCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private storageKey = "legal_ai_platform_cache"
  private persistentKeys: Set<string> = new Set()
  private maxEntries = 100

  constructor() {
    this.loadFromStorage()
    this.setupCleanupInterval()
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   * @param persistent Whether to persist in localStorage
   */
  set<T>(key: string, value: T, ttl = 5 * 60 * 1000, persistent = false): void {
    // Enforce cache size limit
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      this.evictOldest()
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
    }

    this.cache.set(key, entry)

    if (persistent) {
      this.persistentKeys.add(key)
      this.saveToStorage()
    }
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      return undefined
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key)
    this.persistentKeys.delete(key)
    this.saveToStorage()
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear()
    this.persistentKeys.clear()
    this.saveToStorage()
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Save persistent cache entries to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === "undefined") return

    const persistentEntries: Record<string, CacheEntry<any>> = {}

    this.persistentKeys.forEach((key) => {
      const entry = this.cache.get(key)
      if (entry) {
        persistentEntries[key] = entry
      }
    })

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(persistentEntries))
    } catch (error) {
      console.error("Error saving cache to localStorage:", error)
    }
  }

  /**
   * Load persistent cache entries from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return

      const entries = JSON.parse(stored) as Record<string, CacheEntry<any>>

      Object.entries(entries).forEach(([key, entry]) => {
        // Only load non-expired entries
        if (Date.now() - entry.timestamp <= entry.ttl) {
          this.cache.set(key, entry)
          this.persistentKeys.add(key)
        }
      })
    } catch (error) {
      console.error("Error loading cache from localStorage:", error)
    }
  }

  /**
   * Set up interval to clean expired entries
   */
  private setupCleanupInterval(): void {
    if (typeof window === "undefined") return

    // Clean up every minute
    setInterval(() => {
      let hasDeleted = false

      this.cache.forEach((entry, key) => {
        if (Date.now() - entry.timestamp > entry.ttl) {
          this.cache.delete(key)
          this.persistentKeys.delete(key)
          hasDeleted = true
        }
      })

      if (hasDeleted) {
        this.saveToStorage()
      }
    }, 60 * 1000)
  }

  /**
   * Evict the oldest entry from the cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Number.POSITIVE_INFINITY

    this.cache.forEach((entry, key) => {
      // Skip persistent entries if possible
      if (!this.persistentKeys.has(key) && entry.timestamp < oldestTime) {
        oldestKey = key
        oldestTime = entry.timestamp
      }
    })

    // If all entries are persistent, remove the oldest persistent entry
    if (oldestKey === null) {
      this.cache.forEach((entry, key) => {
        if (entry.timestamp < oldestTime) {
          oldestKey = key
          oldestTime = entry.timestamp
        }
      })
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.persistentKeys.delete(oldestKey)
    }
  }
}

// Singleton instance
export const clientCache = typeof window !== "undefined" ? new ClientCache() : null

/**
 * React hook for using the client cache
 */
export function useClientCache() {
  return clientCache
}
