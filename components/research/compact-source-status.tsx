"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Database, CheckCircle, AlertCircle, Settings } from "lucide-react"

interface CompactSourceStatusProps {
  useRAG: boolean
  useLiveSources: boolean
}

export function CompactSourceStatus({ useRAG, useLiveSources }: CompactSourceStatusProps) {
  const [sourceStatus, setSourceStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkSourceStatus()
    const interval = setInterval(checkSourceStatus, 300000) // Check every 5 minutes
    return () => clearInterval(interval)
  }, [])

  const checkSourceStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/legal-sources/status")
      if (response.ok) {
        const data = await response.json()
        setSourceStatus(data)
      }
    } catch (error) {
      console.error("Error checking source status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 border-green-200"
      case "limited":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-3 w-3" />
      case "limited":
        return <AlertCircle className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  const onlineCount = sourceStatus ? Object.values(sourceStatus).filter((s: any) => s.status === "online").length : 0
  const totalCount = sourceStatus ? Object.keys(sourceStatus).length : 4

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-3">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Database className="h-3 w-3" />
              <span className="text-xs font-medium">
                {onlineCount}/{totalCount}
              </span>
            </div>
            <Badge variant="outline" className="h-5 px-2 text-xs">
              {useRAG && useLiveSources ? "Enhanced" : useRAG ? "RAG" : useLiveSources ? "Live" : "Basic"}
            </Badge>
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Legal Source Status</h3>
            <Button variant="ghost" size="sm" onClick={checkSourceStatus} disabled={isLoading}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 animate-pulse"
                >
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : sourceStatus ? (
            <div className="space-y-2">
              {Object.entries(sourceStatus).map(([key, source]: [string, any]) => (
                <div key={key} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(source.status)}`}
                  >
                    {getStatusIcon(source.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{source.name}</p>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(source.status)}`}>
                        {source.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{source.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">Unable to check source status</p>
          )}

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <span>
                {onlineCount} of {totalCount} sources online
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
