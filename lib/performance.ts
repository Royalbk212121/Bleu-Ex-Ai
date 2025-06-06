/**
 * Performance optimization utilities
 */

// Cache for memoization
const memoCache = new Map<string, { value: any; timestamp: number }>()

// Default cache TTL (5 minutes)
const DEFAULT_TTL = 5 * 60 * 1000

/**
 * Memoize a function with TTL
 * @param fn Function to memoize
 * @param keyFn Function to generate cache key from arguments
 * @param ttl Time to live in milliseconds
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args),
  ttl: number = DEFAULT_TTL,
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn(...args)
    const cached = memoCache.get(key)
    const now = Date.now()

    if (cached && now - cached.timestamp < ttl) {
      return cached.value
    }

    const result = fn(...args)

    // Handle promises
    if (result instanceof Promise) {
      return result.then((value) => {
        memoCache.set(key, { value, timestamp: now })
        return value
      }) as ReturnType<T>
    }

    memoCache.set(key, { value: result, timestamp: now })
    return result
  }) as T
}

/**
 * Clear memoization cache
 * @param keyPattern Optional regex pattern to match keys
 */
export function clearMemoCache(keyPattern?: RegExp): void {
  if (keyPattern) {
    for (const key of memoCache.keys()) {
      if (keyPattern.test(key)) {
        memoCache.delete(key)
      }
    }
  } else {
    memoCache.clear()
  }
}

/**
 * Debounce a function
 * @param fn Function to debounce
 * @param wait Wait time in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>): void => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      fn(...args)
      timeout = null
    }, wait)
  }
}

/**
 * Throttle a function
 * @param fn Function to throttle
 * @param limit Limit time in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false
  let lastArgs: Parameters<T> | null = null

  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true

      setTimeout(() => {
        inThrottle = false
        if (lastArgs) {
          const currentArgs = lastArgs
          lastArgs = null
          fn(...currentArgs)
        }
      }, limit)
    } else {
      lastArgs = args
    }
  }
}

/**
 * Measure execution time of a function
 * @param fn Function to measure
 * @param label Label for console output
 */
export function measureTime<T extends (...args: any[]) => any>(fn: T, label: string): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now()
    const result = fn(...args)

    if (result instanceof Promise) {
      return result.then((value) => {
        const end = performance.now()
        console.log(`${label} took ${end - start}ms`)
        return value
      }) as ReturnType<T>
    }

    const end = performance.now()
    console.log(`${label} took ${end - start}ms`)
    return result
  }) as T
}

/**
 * Batch multiple requests into a single request
 * @param batchFn Function that processes a batch of items
 * @param options Batch options
 */
export function createBatcher<T, R>(
  batchFn: (items: T[]) => Promise<R[]>,
  options: { maxBatchSize?: number; maxWaitTime?: number } = {},
) {
  const { maxBatchSize = 100, maxWaitTime = 50 } = options
  let batch: T[] = []
  let callbacks: Array<(result: R) => void> = []
  let timeout: NodeJS.Timeout | null = null

  const processBatch = async () => {
    const currentBatch = [...batch]
    const currentCallbacks = [...callbacks]

    batch = []
    callbacks = []
    timeout = null

    try {
      const results = await batchFn(currentBatch)

      results.forEach((result, i) => {
        currentCallbacks[i](result)
      })
    } catch (error) {
      currentCallbacks.forEach((callback) => {
        callback(error as any)
      })
    }
  }

  return (item: T): Promise<R> => {
    return new Promise((resolve) => {
      batch.push(item)
      callbacks.push(resolve)

      if (batch.length === maxBatchSize) {
        if (timeout) {
          clearTimeout(timeout)
        }
        processBatch()
      } else if (!timeout) {
        timeout = setTimeout(processBatch, maxWaitTime)
      }
    })
  }
}
