"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Database, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DocumentStorageInitializer() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initializeStorage = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/database/init-document-storage", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize document storage")
      }

      setSuccess(true)
    } catch (err) {
      setSuccess(false)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Document Storage Setup
        </CardTitle>
        <CardDescription>Initialize document storage tables and functions</CardDescription>
      </CardHeader>
      <CardContent>
        {success === true && (
          <Alert className="mb-4 border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Document storage initialized successfully.</AlertDescription>
          </Alert>
        )}

        {success === false && error && (
          <Alert className="mb-4 border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-gray-500">
          This will create the necessary tables and functions for document storage in your Supabase database. Run this
          once during initial setup or when updating the document storage schema.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={initializeStorage} disabled={loading} className="flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          {loading ? "Initializing..." : "Initialize Document Storage"}
        </Button>
      </CardFooter>
    </Card>
  )
}
