"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Database, Globe, WifiOff, RefreshCw, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react"

interface LiveSourcesPanelProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

interface SourceStatus {
  status: "online" | "limited" | "offline"
  message: string
  resultCount: number
}

export function LiveSourcesPanel({ enabled, onToggle }: LiveSourcesPanelProps) {
  const [sourceStatus, setSourceStatus] = useState<Record<string, SourceStatus>>({})
  const [loading, setLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const legalSources = [
    {
      id: "internal",
      name: "Internal Database",
      description: "Curated legal documents and cases",
      icon: Database,
      color: "bg-blue-500",
    },
    {
      id: "google_scholar",
      name: "Google Scholar",
      description: "Free case law and legal documents",
      icon: Globe,
      color: "bg-green-500",
    },
    {
      id: "justia",
      name: "Justia",
      description: "Free legal information database",
      icon: Globe,
      color: "bg-purple-500",
    },
    {
      id: "court_listener",
      name: "CourtListener",
      description: "Federal court opinions and data",
      icon: Globe,
      color: "bg-orange-500",
    },
  ]

  const checkSourceStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Checking source status...")

      const response = await fetch("/api/legal-sources/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.sources) {
        setSourceStatus(data.sources)
        setLastChecked(new Date())

        if (data.error) {
          setError(data.error)
        }

        console.log("Source status updated:", data.sources)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error checking source status:", error)
      setError(error instanceof Error ? error.message : "Unknown error")

      // Set fallback status when API fails
      const fallbackStatus: Record<string, SourceStatus> = {
        internal: {
          status: "online",
          message: "Internal database available",
          resultCount: 1,
        },
        google_scholar: {
          status: "limited",
          message: "Fallback mode - limited functionality",
          resultCount: 2,
        },
        justia: {
          status: "limited",
          message: "Fallback mode - limited functionality",
          resultCount: 2,
        },
        court_listener: {
          status: "limited",
          message: "Fallback mode - limited functionality",
          resultCount: 2,
        },
      }

      setSourceStatus(fallbackStatus)
      setLastChecked(new Date())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (enabled) {
      checkSourceStatus()
      // Auto-refresh every 5 minutes
      const interval = setInterval(checkSourceStatus, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [enabled])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return CheckCircle
      case "limited":
        return AlertCircle
      default:
        return WifiOff
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
      case "limited":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
    }
  }

  const onlineCount = Object.values(sourceStatus).filter((s) => s.status === "online").length
  const limitedCount = Object.values(sourceStatus).filter((s) => s.status === "limited").length
  const totalSources = legalSources.length

  return (
    <Card className="glass-card border-green-200/50 dark:border-green-800/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Database className="h-4 w-4 text-white" />
            </div>
            <span>Live Legal Sources</span>
            {enabled && Object.keys(sourceStatus).length > 0 && (
              <Badge variant="outline" className="ml-2">
                {onlineCount + limitedCount}/{totalSources} Available
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={checkSourceStatus} disabled={loading || !enabled}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Switch checked={enabled} onCheckedChange={onToggle} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {enabled
              ? "Searching live legal databases for real-time information"
              : "Enable to search external legal databases"}
          </p>
          {lastChecked && (
            <p className="text-xs text-muted-foreground">Last checked: {lastChecked.toLocaleTimeString()}</p>
          )}
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">{error}</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {legalSources.map((source) => {
            const status = sourceStatus[source.id]
            const StatusIcon = status ? getStatusIcon(status.status) : WifiOff

            return (
              <div
                key={source.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                  enabled && status?.status === "online"
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : enabled && status?.status === "limited"
                      ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                      : "bg-muted border-border"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${source.color} rounded-lg flex items-center justify-center`}>
                    <source.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{source.name}</div>
                    <div className="text-xs text-muted-foreground">{status?.message || source.description}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {enabled && status ? (
                    <Badge
                      variant={status.status === "online" ? "default" : "secondary"}
                      className={getStatusColor(status.status)}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.status === "online" ? "Online" : status.status === "limited" ? "Limited" : "Offline"}
                    </Badge>
                  ) : enabled ? (
                    <Badge variant="secondary" className="text-xs">
                      {loading ? "Checking..." : "Unknown"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Disabled
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {enabled && Object.keys(sourceStatus).length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-300">
                Live Search Active ({onlineCount + limitedCount} sources)
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Your queries will search across all available legal databases in real-time
            </p>
            {limitedCount > 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Some sources have limited functionality. Add API keys for full access.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
