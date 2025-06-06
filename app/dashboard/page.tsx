"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { DashboardMetrics } from "@/components/dashboard/metrics"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Dashboard" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Welcome to LegalAI Platform</h1>
              <p className="text-gray-600">Your comprehensive legal AI workspace</p>
            </div>

            <DashboardMetrics />

            <div className="grid lg:grid-cols-2 gap-6">
              <QuickActions />
              <RecentActivity />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
