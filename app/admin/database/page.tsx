import { DatabaseStatusPanel } from "@/components/database-status-panel"
import { DocumentStorageInitializer } from "@/components/document-storage-initializer"
import { DatabaseOptimization } from "@/components/database-optimization"

export default function AdminDatabasePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Database Administration</h1>

      <div className="grid gap-8">
        <DatabaseStatusPanel />
        <DocumentStorageInitializer />
        <DatabaseOptimization />
      </div>
    </div>
  )
}
