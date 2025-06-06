/**
 * Memory management utilities
 */

// WeakMap to store cleanup functions for components
const cleanupFunctions = new WeakMap<object, () => void>()

/**
 * Register a cleanup function for a component
 * @param component Component reference
 * @param cleanup Cleanup function
 */
export function registerCleanup(component: object, cleanup: () => void): void {
  cleanupFunctions.set(component, cleanup)
}

/**
 * Run cleanup for a component
 * @param component Component reference
 */
export function runCleanup(component: object): void {
  const cleanup = cleanupFunctions.get(component)
  if (cleanup) {
    cleanup()
    cleanupFunctions.delete(component)
  }
}

/**
 * Create a disposable resource
 * @param init Function to initialize the resource
 * @param dispose Function to dispose the resource
 */
export function createDisposable<T>(
  init: () => T,
  dispose: (resource: T) => void,
): {
  get: () => T
  dispose: () => void
} {
  let resource: T | null = null
  let isDisposed = false

  return {
    get: () => {
      if (isDisposed) {
        throw new Error("Attempted to use disposed resource")
      }

      if (resource === null) {
        resource = init()
      }

      return resource
    },
    dispose: () => {
      if (!isDisposed && resource !== null) {
        dispose(resource)
        resource = null
        isDisposed = true
      }
    },
  }
}

/**
 * Create a resource pool
 * @param create Function to create a resource
 * @param destroy Function to destroy a resource
 * @param options Pool options
 */
export function createResourcePool<T>(
  create: () => T,
  destroy: (resource: T) => void,
  options: {
    initialSize?: number
    maxSize?: number
    validateOnGet?: (resource: T) => boolean
  } = {},
) {
  const { initialSize = 5, maxSize = 10, validateOnGet = () => true } = options

  const available: T[] = []
  const inUse = new Set<T>()

  // Initialize pool
  for (let i = 0; i < initialSize; i++) {
    try {
      available.push(create())
    } catch (error) {
      console.error("Error initializing resource pool:", error)
    }
  }

  return {
    /**
     * Get a resource from the pool
     */
    acquire: (): T => {
      let resource: T | undefined

      // Try to get an available resource
      while (available.length > 0) {
        resource = available.pop()

        if (resource && validateOnGet(resource)) {
          break
        } else if (resource) {
          // Resource failed validation, destroy it
          destroy(resource)
          resource = undefined
        }
      }

      // Create a new resource if none available
      if (!resource) {
        if (inUse.size >= maxSize) {
          throw new Error(`Resource pool exhausted (max size: ${maxSize})`)
        }

        resource = create()
      }

      inUse.add(resource)
      return resource
    },

    /**
     * Return a resource to the pool
     */
    release: (resource: T): void => {
      if (inUse.has(resource)) {
        inUse.delete(resource)
        available.push(resource)
      }
    },

    /**
     * Get the number of available resources
     */
    availableCount: (): number => {
      return available.length
    },

    /**
     * Get the number of resources in use
     */
    inUseCount: (): number => {
      return inUse.size
    },

    /**
     * Destroy all resources and reset the pool
     */
    reset: (): void => {
      // Destroy all resources
      ;[...available, ...inUse].forEach(destroy)

      // Clear collections
      available.length = 0
      inUse.clear()

      // Reinitialize
      for (let i = 0; i < initialSize; i++) {
        try {
          available.push(create())
        } catch (error) {
          console.error("Error reinitializing resource pool:", error)
        }
      }
    },
  }
}

/**
 * Create a memory-efficient object pool
 * @param factory Factory function to create objects
 * @param reset Function to reset an object for reuse
 * @param initialSize Initial pool size
 */
export function createObjectPool<T extends object>(factory: () => T, reset: (obj: T) => void, initialSize = 10) {
  const pool: T[] = []

  // Initialize pool
  for (let i = 0; i < initialSize; i++) {
    pool.push(factory())
  }

  return {
    /**
     * Get an object from the pool
     */
    get: (): T => {
      if (pool.length > 0) {
        return pool.pop()!
      }
      return factory()
    },

    /**
     * Return an object to the pool
     */
    release: (obj: T): void => {
      reset(obj)
      pool.push(obj)
    },
  }
}

/**
 * Monitor memory usage
 * @param warningThreshold Warning threshold in MB
 * @param criticalThreshold Critical threshold in MB
 * @param callback Callback function
 */
export function monitorMemoryUsage(
  warningThreshold = 500,
  criticalThreshold = 800,
  callback?: (usage: { used: number; total: number; status: "normal" | "warning" | "critical" }) => void,
) {
  // Only works in browser
  if (typeof window === "undefined" || !("performance" in window)) {
    return { stop: () => {} }
  }

  const checkMemory = () => {
    // @ts-ignore - TypeScript doesn't know about memory property
    const memory = performance.memory

    if (!memory) return

    const used = Math.round(memory.usedJSHeapSize / (1024 * 1024))
    const total = Math.round(memory.jsHeapSizeLimit / (1024 * 1024))

    let status: "normal" | "warning" | "critical" = "normal"

    if (used > criticalThreshold) {
      status = "critical"
      console.warn(`Critical memory usage: ${used}MB / ${total}MB`)
    } else if (used > warningThreshold) {
      status = "warning"
      console.info(`High memory usage: ${used}MB / ${total}MB`)
    }

    if (callback) {
      callback({ used, total, status })
    }
  }

  const intervalId = setInterval(checkMemory, 10000) // Check every 10 seconds

  return {
    stop: () => clearInterval(intervalId),
  }
}
