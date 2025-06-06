"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Check, AlertCircle, Loader2 } from "lucide-react"

interface DatabaseStatus {
  status: string
  tables: string[]
  counts: Record<string, number>
  timestamp: string
  error?: string
}

export function DatabaseSetup() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupSuccess, setSetupSuccess] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)

  const checkDatabaseStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/database-status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Error checking database status:", error)
      setStatus({
        status: "error",
        tables: [],
        counts: {},
        timestamp: new Date().toISOString(),
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const setupDatabase = async () => {
    setSetupLoading(true)
    setSetupSuccess(false)
    setSetupError(null)

    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
      })

      if (response.ok) {
        setSetupSuccess(true)
        // Refresh status after setup
        await checkDatabaseStatus()
      } else {
        const errorData = await response.json()
        setSetupError(errorData.error || "Failed to set up database")
      }
    } catch (error) {
      console.error("Database setup error:", error)
      setSetupError("An unexpected error occurred")
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Database Setup</span>
        </CardTitle>
        <CardDescription>Configure and initialize the legal database schema</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Display */}
        {status && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium">Database Status:</h3>
              <Badge
                variant={status.status === "connected" ? "default" : "destructive"}
                className={status.status === "connected" ? "bg-green-100 text-green-800" : ""}
              >
                {status.status === "connected" ? "Connected" : "Error"}
              </Badge>
            </div>

            {status.status === "connected" && (
              <>
                <div>
                  <h4 className="text-sm font-medium mb-2">Tables ({status.tables.length}):</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {status.tables.map((table) => (
                      <Badge key={table} variant="outline" className="justify-start">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>

                {Object.keys(status.counts).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Record Counts:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(status.counts).map(([key, count]) => (
                        <div key={key} className="bg-muted p-3 rounded-md text-center">
                          <div className="text-lg font-bold">{count}</div>
                          <div className="text-xs text-muted-foreground">{key}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {status.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error:</span>
                </div>
                <p className="mt-1">{status.error}</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Last checked: {new Date(status.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Setup Results */}
        {setupSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-800 text-sm flex items-center space-x-2">
            <Check className="h-4 w-4" />
            <span>Database setup completed successfully!</span>
          </div>
        )}

        {setupError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Setup Error:</span>
            </div>
            <p className="mt-1">{setupError}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={checkDatabaseStatus} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Check Status
        </Button>

        <Button onClick={setupDatabase} disabled={setupLoading}>
          {setupLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Initialize Database
        </Button>
      </CardFooter>
    </Card>
  )
}
