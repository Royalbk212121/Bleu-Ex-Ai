"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

export function DatabaseOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleOptimize = async () => {
    setIsOptimizing(true)
    setResult(null)

    try {
      const response = await fetch("/api/database/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          message: "Database optimization completed successfully.",
        })
      } else {
        setResult({
          success: false,
          message: `Optimization failed: ${data.error || "Unknown error"}`,
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Optimization failed: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Optimization</CardTitle>
        <CardDescription>
          Optimize database performance by cleaning up old data and running maintenance tasks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This process will remove old logs, clean up temporary data, and optimize database indexes. It may take a few
          minutes to complete depending on the database size.
        </p>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleOptimize} disabled={isOptimizing}>
          {isOptimizing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Optimizing...
            </>
          ) : (
            "Optimize Database"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
