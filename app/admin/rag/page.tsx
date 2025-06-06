"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Database, Search, BarChart3, RefreshCw } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

interface RAGStatus {
  status: string
  statistics: {
    totalDocuments: number
    totalChunks: number
    documentTypes: string[]
    jurisdictions: string[]
    lastUpdated: string
  }
  capabilities: {
    vectorSearch: boolean
    semanticRetrieval: boolean
    citationExtraction: boolean
    legalAnalysis: boolean
  }
}

export default function RAGAdmin() {
  const [ragStatus, setRAGStatus] = useState<RAGStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRAGStatus()
  }, [])

  const fetchRAGStatus = async () => {
    try {
      const response = await fetch("/api/rag/status")
      if (response.ok) {
        const data = await response.json()
        setRAGStatus(data)
      }
    } catch (error) {
      console.error("Error fetching RAG status:", error)
    } finally {
      setLoading(false)
    }
  }

  const seedRAGSystem = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/rag/seed", { method: "POST" })
      if (response.ok) {
        await fetchRAGStatus()
        alert("RAG system seeded successfully!")
      }
    } catch (error) {
      console.error("Error seeding RAG system:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="RAG Administration" />
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="RAG Administration" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">RAG System Administration</h1>
                <p className="text-gray-600">Manage the Retrieval-Augmented Generation system</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={fetchRAGStatus}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={seedRAGSystem}>
                  <Database className="h-4 w-4 mr-2" />
                  Seed System
                </Button>
              </div>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  <Database className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ragStatus?.statistics.totalDocuments || 0}</div>
                  <p className="text-xs text-muted-foreground">Legal documents indexed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vector Chunks</CardTitle>
                  <Search className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ragStatus?.statistics.totalChunks || 0}</div>
                  <p className="text-xs text-muted-foreground">Searchable text segments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Document Types</CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ragStatus?.statistics.documentTypes.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Legal practice areas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  <div
                    className={`h-3 w-3 rounded-full ${ragStatus?.status === "active" ? "bg-green-500" : "bg-red-500"}`}
                  />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{ragStatus?.status || "Unknown"}</div>
                  <p className="text-xs text-muted-foreground">RAG system status</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Information */}
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {ragStatus?.statistics.documentTypes.map((type, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <Badge variant="outline">{type}</Badge>
                            <span className="text-sm text-gray-600">Active</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Jurisdictions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {ragStatus?.statistics.jurisdictions.map((jurisdiction, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <Badge variant="outline">{jurisdiction}</Badge>
                            <span className="text-sm text-gray-600">Indexed</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Indexing Progress</span>
                          <span>100%</span>
                        </div>
                        <Progress value={100} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total Documents:</span>
                          <span className="ml-2">{ragStatus?.statistics.totalDocuments}</span>
                        </div>
                        <div>
                          <span className="font-medium">Vector Chunks:</span>
                          <span className="ml-2">{ragStatus?.statistics.totalChunks}</span>
                        </div>
                        <div>
                          <span className="font-medium">Last Updated:</span>
                          <span className="ml-2">
                            {ragStatus?.statistics.lastUpdated
                              ? new Date(ragStatus.statistics.lastUpdated).toLocaleDateString()
                              : "Never"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Average Chunks/Doc:</span>
                          <span className="ml-2">
                            {ragStatus?.statistics.totalDocuments
                              ? Math.round(ragStatus.statistics.totalChunks / ragStatus.statistics.totalDocuments)
                              : 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="capabilities" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>System Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {ragStatus?.capabilities &&
                        Object.entries(ragStatus.capabilities).map(([capability, enabled]) => (
                          <div key={capability} className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="font-medium capitalize">{capability.replace(/([A-Z])/g, " $1")}</span>
                            <Badge variant={enabled ? "default" : "secondary"}>
                              {enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        ))}
                    </div>
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
