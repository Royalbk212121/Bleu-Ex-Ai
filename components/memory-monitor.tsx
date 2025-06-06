"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { monitorMemoryUsage } from "@/lib/memory-management"

export function MemoryMonitor() {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number
    total: number
    status: "normal" | "warning" | "critical"
  } | null>(null)

  useEffect(() => {
    // Only works in browsers that expose performance.memory (Chrome)
    // @ts-ignore - TypeScript doesn't know about memory property
    if (typeof window !== "undefined" && window.performance && window.performance.memory) {
      const monitor = monitorMemoryUsage(500, 800, (usage) => {
        setMemoryUsage(usage)
      })

      return () => monitor.stop()
    }
  }, [])

  if (!memoryUsage) {
    return null
  }

  const percentage = Math.round((memoryUsage.used / memoryUsage.total) * 100)

  const statusColor = {
    normal: "bg-green-500",
    warning: "bg-yellow-500",
    critical: "bg-red-500",
  }[memoryUsage.status]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Memory Usage
          <span className={`ml-2 inline-block w-3 h-3 rounded-full ${statusColor}`} aria-hidden="true" />
        </CardTitle>
        <CardDescription>Client-side JavaScript memory consumption</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Used: {memoryUsage.used} MB</span>
            <span>Total: {memoryUsage.total} MB</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {memoryUsage.status === "normal" && "Memory usage is normal."}
            {memoryUsage.status === "warning" && "Memory usage is high. Consider closing unused tabs."}
            {memoryUsage.status === "critical" && "Memory usage is critical. Save your work and refresh the page."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
