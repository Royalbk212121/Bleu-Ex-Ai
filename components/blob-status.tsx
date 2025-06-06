"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Upload, RefreshCw } from "lucide-react"

interface BlobStatus {
  success: boolean
  message: string
  blobCount?: number
  token: string
  error?: string
}

export function BlobStatus() {
  const [status, setStatus] = useState<BlobStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [testUploading, setTestUploading] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/blob/test")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        success: false,
        message: "Failed to check blob status",
        token: "❌ Error",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const testUpload = async () => {
    setTestUploading(true)
    try {
      const response = await fetch("/api/blob/test", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        alert(`Test upload successful! File URL: ${data.url}`)
      } else {
        alert(`Test upload failed: ${data.error}`)
      }
    } catch (error) {
      alert(`Test upload error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setTestUploading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Vercel Blob Status
          <Button size="sm" variant="outline" onClick={checkStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status && (
          <>
            <div className="flex items-center gap-2">
              {status.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">{status.message}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Token Status</p>
                <Badge variant={status.token.includes("✅") ? "default" : "destructive"}>{status.token}</Badge>
              </div>

              {status.blobCount !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Files in Storage</p>
                  <Badge variant="outline">{status.blobCount} files</Badge>
                </div>
              )}
            </div>

            {status.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{status.error}</p>
              </div>
            )}

            <Button onClick={testUpload} disabled={testUploading || !status.success} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              {testUploading ? "Testing Upload..." : "Test Upload"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
