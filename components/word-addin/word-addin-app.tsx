"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, CheckCircle, Sparkles, Upload, Settings } from "lucide-react"

declare global {
  interface Window {
    Office: any
  }
}

interface AnalysisResult {
  type: "suggestion" | "error" | "improvement"
  text: string
  position: number
  severity: "low" | "medium" | "high"
  category: string
}

export function WordAddinApp() {
  const [isOfficeReady, setIsOfficeReady] = useState(false)
  const [documentContent, setDocumentContent] = useState("")
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Initialize Office.js
    if (typeof window !== "undefined" && window.Office) {
      window.Office.onReady(() => {
        setIsOfficeReady(true)
      })
    }
  }, [])

  const readDocumentContent = async () => {
    if (!isOfficeReady) return

    try {
      await window.Office.context.document.body.load("text")
      await window.Office.context.sync()

      const content = window.Office.context.document.body.text
      setDocumentContent(content)
      return content
    } catch (error) {
      console.error("Error reading document:", error)
    }
  }

  const analyzeDocument = async () => {
    setIsAnalyzing(true)
    setProgress(0)

    try {
      const content = await readDocumentContent()
      if (!content) return

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/word-addin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      const results = await response.json()

      clearInterval(progressInterval)
      setProgress(100)
      setAnalysisResults(results.analysis || [])
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const applySuggestion = async (result: AnalysisResult) => {
    if (!isOfficeReady) return

    try {
      // Find and select the text at the specified position
      const range = window.Office.context.document.body.search(result.text)
      range.load("text")
      await window.Office.context.sync()

      if (range.items.length > 0) {
        const targetRange = range.items[0]

        if (result.type === "suggestion") {
          // Insert comment
          targetRange.insertComment(result.text)
        } else if (result.type === "improvement") {
          // Track changes
          targetRange.insertText(result.text, "Replace")
        }

        await window.Office.context.sync()
      }
    } catch (error) {
      console.error("Error applying suggestion:", error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (!isOfficeReady) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Initializing Office Add-in...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Legal AI Assistant</h1>
              <p className="text-xs text-gray-500">Word Add-in</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Analysis Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
              Document Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Button onClick={analyzeDocument} disabled={isAnalyzing} className="flex-1">
                {isAnalyzing ? "Analyzing..." : "Analyze Document"}
              </Button>
              <Button variant="outline" onClick={readDocumentContent}>
                <Upload className="h-4 w-4" />
              </Button>
            </div>

            {isAnalyzing && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600 text-center">Analyzing legal content... {progress}%</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysisResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Analysis Results
                </span>
                <Badge variant="secondary">{analysisResults.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysisResults.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getSeverityColor(result.severity)}>{result.severity.toUpperCase()}</Badge>
                    <span className="text-xs text-gray-500">{result.category}</span>
                  </div>

                  <p className="text-sm text-gray-700">{result.text}</p>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => applySuggestion(result)}>
                      Apply
                    </Button>
                    <Button size="sm" variant="ghost">
                      Ignore
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Document Stats */}
        {documentContent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Words:</span>
                  <span className="ml-2 font-medium">{documentContent.split(" ").length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Characters:</span>
                  <span className="ml-2 font-medium">{documentContent.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
