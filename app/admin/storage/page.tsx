import { BlobStatus } from "@/components/blob-status"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StoragePage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Storage Management</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <BlobStatus />

        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Documents</span>
                <span className="text-sm font-medium">0 files</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Size</span>
                <span className="text-sm font-medium">0 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Available</span>
                <span className="text-sm font-medium text-green-600">Unlimited</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Max File Size</span>
                <span className="text-sm font-medium">50 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Allowed Types</span>
                <span className="text-sm font-medium">PDF, DOCX, TXT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Access</span>
                <span className="text-sm font-medium">Public</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
