"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Database, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DatabaseStatus {
  connected: boolean
  tablesExist: boolean
  documentCount: number
  error?: string
}

export function DatabaseStatusChecker() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)

  const checkStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/database/status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        connected: false,
        tablesExist: false,
        documentCount: 0,
        error: "Failed to check database status",
      })
    } finally {
      setLoading(false)
    }
  }

  const initializeDatabase = async () => {
    try {
      setInitializing(true)
      const response = await fetch("/api/database/initialize", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        await checkStatus()
      } else {
        setStatus((prev) => (prev ? { ...prev, error: data.error } : null))
      }
    } catch (error) {
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              error: "Failed to initialize database",
            }
          : null,
      )
    } finally {
      setInitializing(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Checking database status...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Status
        </CardTitle>
        <CardDescription>Current status of the legal database and search functionality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {status?.connected ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">Connection</span>
            <Badge variant={status?.connected ? "default" : "destructive"}>
              {status?.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {status?.tablesExist ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="text-sm">Tables</span>
            <Badge variant={status?.tablesExist ? "default" : "secondary"}>
              {status?.tablesExist ? "Ready" : "Not Found"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">Documents:</span>
          <Badge variant="outline">{status?.documentCount || 0} documents</Badge>
        </div>

        {status?.error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        {!status?.tablesExist && (
          <div className="space-y-2">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Database tables not found. Initialize the database to enable full functionality.
              </AlertDescription>
            </Alert>
            <Button onClick={initializeDatabase} disabled={initializing} className="w-full">
              {initializing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                "Initialize Database"
              )}
            </Button>
          </div>
        )}

        <Button variant="outline" onClick={checkStatus} disabled={loading} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  )
}
