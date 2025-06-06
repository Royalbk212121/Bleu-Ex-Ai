"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, AlertCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/db"

export function SupabaseSetup() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)

  const checkSupabaseConnection = async () => {
    setLoading(true)
    try {
      // Test Supabase connection
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")

      if (error) throw error

      setStatus({
        status: "connected",
        tables: data?.map((t) => t.table_name) || [],
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Supabase connection error:", error)
      setStatus({
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const setupSupabaseSchema = async () => {
    setSetupLoading(true)
    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
      })

      if (response.ok) {
        await checkSupabaseConnection()
      } else {
        const errorData = await response.json()
        setStatus({
          status: "error",
          error: errorData.error || "Failed to set up Supabase schema",
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Supabase setup error:", error)
      setStatus({
        status: "error",
        error: "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Supabase Setup</span>
        </CardTitle>
        <CardDescription>Configure and initialize the Supabase database schema</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {status && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium">Connection Status:</h3>
              <Badge
                variant={status.status === "connected" ? "default" : "destructive"}
                className={status.status === "connected" ? "bg-green-100 text-green-800" : ""}
              >
                {status.status === "connected" ? "Connected" : "Error"}
              </Badge>
            </div>

            {status.status === "connected" && status.tables?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Tables ({status.tables.length}):</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {status.tables.map((table: string) => (
                    <Badge key={table} variant="outline" className="justify-start">
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>
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
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={checkSupabaseConnection} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Check Connection
        </Button>

        <Button onClick={setupSupabaseSchema} disabled={setupLoading}>
          {setupLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Setup Schema
        </Button>
      </CardFooter>
    </Card>
  )
}
