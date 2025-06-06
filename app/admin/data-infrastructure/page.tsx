import { DatabaseStatusPanel } from "@/components/database-status-panel"
import { DataIngestionPanel } from "@/components/data-ingestion-panel"
import { MemoryMonitor } from "@/components/memory-monitor"

export default function AdminDataInfrastructurePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Data Infrastructure</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-8">
          <DatabaseStatusPanel />
          <MemoryMonitor />
        </div>
        <div>
          <DataIngestionPanel />
        </div>
      </div>
    </div>
  )
}
