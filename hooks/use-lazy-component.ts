"use client"

import type React from "react"

import { useState, useEffect, type ComponentType } from "react"

/**
 * Hook for lazy loading components
 * @param importFn Function that imports the component
 * @param fallback Optional fallback component to show while loading
 */
export function useLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode,
): {
  Component: T | null
  loading: boolean
  error: Error | null
} {
  const [Component, setComponent] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const loadComponent = async () => {
      try {
        const module = await importFn()

        if (mounted) {
          setComponent(module.default)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error("Error loading component:", err)
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      }
    }

    loadComponent()

    return () => {
      mounted = false
    }
  }, [importFn])

  return { Component, loading, error }
}
