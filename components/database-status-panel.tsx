"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Database, RefreshCw } from "lucide-react"

interface DatabaseStatus {
  status: "healthy" | "degraded" | "error"
  timestamp: string
  services: {
    postgres: {
      status: "healthy" | "unhealthy"
      type: string
      purpose: string
    }
    documentStorage: {
      status: "healthy" | "unhealthy"
      type: string
      purpose: string
    }
    vectordb: {
      status: "healthy" | "unhealthy"
      type: string
      purpose: string
    }
  }
}

export function DatabaseStatusPanel() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/database/health")

      if (!response.ok) {
        throw new Error(`Failed to fetch database status: ${response.status}`)
      }

      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Refresh status every 60 seconds
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500"
      case "degraded":
        return "bg-yellow-500"
      case "unhealthy":
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString()
    } catch (e) {
      return timestamp
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Status
        </CardTitle>
        <CardDescription>Hybrid database infrastructure health and status</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && !status ? (
          <div className="flex items-center justify-center p-6">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error checking database status</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : status ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${getStatusColor(status.status)}`} />
                <span className="font-medium">Overall Status: {status.status.toUpperCase()}</span>
              </div>
              <Badge variant="outline">Last updated: {formatTimestamp(status.timestamp)}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(status.services).map(([key, service]) => (
                <div key={key} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium capitalize">{key}</h3>
                    {service.status === "healthy" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{service.purpose}</p>
                  <Badge variant="secondary" className="mt-2">
                    {service.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto flex items-center gap-1"
          onClick={fetchStatus}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  )
}
