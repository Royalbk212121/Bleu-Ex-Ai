"use client"

import type React from "react"

import { Suspense, lazy, type ComponentType } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface LazyComponentProps {
  importFn: () => Promise<{ default: ComponentType<any> }>
  props?: Record<string, any>
  fallback?: React.ReactNode
}

export function LazyComponent({ importFn, props = {}, fallback }: LazyComponentProps) {
  const Component = lazy(importFn)

  return (
    <Suspense fallback={fallback || <DefaultFallback />}>
      <Component {...props} />
    </Suspense>
  )
}

function DefaultFallback() {
  return (
    <div className="w-full space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-8 w-3/4" />
    </div>
  )
}
