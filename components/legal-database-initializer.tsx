"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, Play, CheckCircle, AlertCircle, Loader2, Info } from "lucide-react"

export function LegalDatabaseInitializer() {
  const [initializing, setInitializing] = useState(false)
  const [initResult, setInitResult] = useState<any>(null)

  const initializeDatabase = async () => {
    setInitializing(true)
    setInitResult(null)

    try {
      const response = await fetch("/api/initialize-legal-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enableVectorExtension: true,
        }),
      })

      const result = await response.json()
      setInitResult(result)

      if (result.success) {
        // Also test the connection after initialization
        setTimeout(async () => {
          try {
            await fetch("/api/test-database")
          } catch (error) {
            console.log("Connection test after init:", error)
          }
        }, 1000)
      }
    } catch (error) {
      setInitResult({
        success: false,
        error: "Failed to initialize database",
      })
    } finally {
      setInitializing(false)
    }
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Neon Database Ready:</strong> Your Neon integration is active. Initialize the legal database to enable
          document storage, vector search, and AI-powered legal research.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Initialize Legal Database</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Set up legal document tables with vector search capabilities</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Features to Enable:</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>✅ Legal document storage and indexing</li>
              <li>✅ Vector embeddings for semantic search</li>
              <li>✅ Legal case database</li>
              <li>✅ Research query logging</li>
              <li>✅ AI-powered legal research assistant</li>
            </ul>
          </div>

          <Button onClick={initializeDatabase} disabled={initializing} className="w-full">
            {initializing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initializing Legal Database...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Initialize Legal Database
              </>
            )}
          </Button>

          {initResult && (
            <div
              className={`p-4 rounded-lg border ${
                initResult.success
                  ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                  : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {initResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span
                  className={`font-medium ${
                    initResult.success ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"
                  }`}
                >
                  {initResult.success ? "Success!" : "Error"}
                </span>
              </div>

              <p
                className={`text-sm ${
                  initResult.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                }`}
              >
                {initResult.message || initResult.error}
              </p>

              {initResult.suggestion && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium">💡 {initResult.suggestion}</p>
              )}

              {initResult.tables_created && (
                <div className="mt-3">
                  <p className="text-xs font-medium mb-2">Tables Created:</p>
                  <div className="flex flex-wrap gap-1">
                    {initResult.tables_created.map((table: string) => (
                      <Badge key={table} variant="outline" className="text-xs">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {initResult.vector_extension_enabled && (
                <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-xs text-green-800 dark:text-green-300 font-medium">
                    🎉 Vector extension enabled! Your database now supports semantic search and embeddings.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-2">This will create the following tables:</p>
            <div className="grid grid-cols-2 gap-2">
              <ul className="list-disc list-inside space-y-1">
                <li>jurisdictions</li>
                <li>practice_areas</li>
                <li>document_types</li>
                <li>legal_documents</li>
              </ul>
              <ul className="list-disc list-inside space-y-1">
                <li>document_embeddings (vectors)</li>
                <li>legal_cases</li>
                <li>research_queries</li>
                <li>Vector search indexes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
