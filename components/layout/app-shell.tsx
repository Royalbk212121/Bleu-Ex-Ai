"use client"

import type React from "react"

import { useEffect } from "react"
import { useAppSelector, useAppDispatch } from "@/lib/store"
import { setActiveView } from "@/lib/store/slices/uiSlice"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { NotificationCenter } from "@/components/ui/notification-center"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
  view?: "dashboard" | "chat" | "editor" | "research" | "analysis"
}

export function AppShell({ children, view = "dashboard" }: AppShellProps) {
  const dispatch = useAppDispatch()
  const { sidebarCollapsed, loading } = useAppSelector((state) => state.ui)
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  useEffect(() => {
    dispatch(setActiveView(view))
  }, [view, dispatch])

  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {loading.global && <LoadingOverlay />}

      <Sidebar />

      <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <Header />

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      <NotificationCenter />
    </div>
  )
}
