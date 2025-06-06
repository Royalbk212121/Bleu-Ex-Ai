"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, Share, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import Link from "next/link"

interface DocumentDetails {
  id: string
  name: string
  url: string
  size: number
  uploadedAt: string
  type: string
  status: string
  risk: string
  issues: number
  analysis: {
    summary: string
    keyTerms: string[]
    recommendations: string[]
  }
}

export default function DocumentDetails() {
  const { id } = useParams()
  const [document, setDocument] = useState<DocumentDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDocument() {
      try {
        const response = await fetch(`/api/documents/${id}`)
        if (response.ok) {
          const data = await response.json()
          setDocument(data.document)
        } else {
          console.error("Failed to fetch document")
        }
      } catch (error) {
        console.error("Error fetching document:", error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchDocument()
    }
  }, [id])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Document Details" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Document Details" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Document Not Found</h2>
                <p className="text-gray-600 mb-6">The document you're looking for doesn't exist or has been removed.</p>
                <Link href="/documents">
                  <Button>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Documents
                  </Button>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Document Details" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Back Button */}
            <Link href="/documents">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documents
              </Button>
            </Link>

            {/* Document Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{document.name}</h1>
                  <div className="flex items-center space-x-3 mt-1">
                    <Badge variant="outline">{document.type}</Badge>
                    <Badge
                      variant="secondary"
                      className={
                        document.status === "final" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }
                    >
                      {document.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {(document.size / 1024 / 1024).toFixed(2)} MB • Uploaded on{" "}
                      {new Date(document.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Risk Badge */}
            <div className="flex items-center space-x-2">
              <Badge className={getRiskColor(document.risk)}>{document.risk} risk</Badge>
              {document.issues > 0 && (
                <span className="text-sm text-gray-600">{document.issues} issues identified</span>
              )}
            </div>

            {/* Document Content Tabs */}
            <Tabs defaultValue="analysis">
              <TabsList>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
              </TabsList>
              <TabsContent value="analysis" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Summary</h3>
                      <p className="text-gray-700">{document.analysis.summary}</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Key Terms</h3>
                      <div className="flex flex-wrap gap-2">
                        {document.analysis.keyTerms.map((term, index) => (
                          <Badge key={index} variant="outline">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Recommendations</h3>
                      <ul className="space-y-2">
                        {document.analysis.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            {document.risk === "high" ? (
                              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            )}
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="aspect-[8.5/11] bg-white border rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Document preview not available</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="issues" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    {document.issues > 0 ? (
                      <div className="space-y-4">
                        {Array.from({ length: document.issues }).map((_, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-start space-x-3">
                              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                              <div>
                                <h4 className="font-medium">Issue #{index + 1}</h4>
                                <p className="text-gray-600">
                                  {document.risk === "high"
                                    ? "Critical issue requiring immediate attention"
                                    : "Potential issue that should be reviewed"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Issues Found</h3>
                        <p className="text-gray-600">This document has passed all automated checks.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
