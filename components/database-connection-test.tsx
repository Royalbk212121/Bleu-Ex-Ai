"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

export function DatabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-database")
      const data = await response.json()
      setConnectionStatus(data)
    } catch (error) {
      setConnectionStatus({
        status: "error",
        error: "Failed to connect to database",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Neon Database Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Connection Status:</span>
          {connectionStatus ? (
            <Badge
              variant={connectionStatus.status === "connected" ? "default" : "destructive"}
              className={connectionStatus.status === "connected" ? "bg-green-100 text-green-800" : ""}
            >
              {connectionStatus.status === "connected" ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Error
                </>
              )}
            </Badge>
          ) : (
            <Badge variant="secondary">Testing...</Badge>
          )}
        </div>

        {connectionStatus?.status === "connected" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Neon Integration:</span>
                <Badge variant="outline" className="ml-2">
                  Active
                </Badge>
              </div>
              <div>
                <span className="font-medium">Vector Extension:</span>
                <Badge variant={connectionStatus.vector_extension ? "default" : "secondary"} className="ml-2">
                  {connectionStatus.vector_extension ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>

            {connectionStatus.legal_tables?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Legal Tables ({connectionStatus.legal_tables.length}):</h4>
                <div className="flex flex-wrap gap-2">
                  {connectionStatus.legal_tables.map((table: string) => (
                    <Badge key={table} variant="outline">
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(connectionStatus.record_counts || {}).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Record Counts:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(connectionStatus.record_counts).map(([table, count]) => (
                    <div key={table} className="flex justify-between text-sm">
                      <span>{table}:</span>
                      <span className="font-mono">{count as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {connectionStatus?.status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm font-medium">Error: {connectionStatus.error}</p>
            {connectionStatus.suggestion && <p className="text-red-600 text-xs mt-1">{connectionStatus.suggestion}</p>}
          </div>
        )}

        <Button onClick={testConnection} disabled={loading} variant="outline" size="sm">
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Connection
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
