import { PerformanceMonitor } from "@/components/performance-monitor"
import { MemoryMonitor } from "@/components/memory-monitor"
import { DatabaseOptimization } from "@/components/database-optimization"

export default function AdminPerformancePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Performance Monitoring</h1>

      <div className="grid gap-8">
        <PerformanceMonitor />

        <div className="grid gap-8 md:grid-cols-2">
          <MemoryMonitor />
          <DatabaseOptimization />
        </div>
      </div>
    </div>
  )
}
