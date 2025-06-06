"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { MatterDashboard } from "@/components/cmf/matter-dashboard"
import { KnowledgeGraphViewer } from "@/components/cmf/knowledge-graph-viewer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Network, FileText, BarChart3, MessageSquare } from "lucide-react"
import type {
  Matter,
  MatterEntity,
  MatterRelationship,
  RiskAssessment,
  PredictiveInsight,
} from "@/lib/cmf/cognitive-matter-fabric"

export default function MatterPage() {
  const { id } = useParams()
  const [matter, setMatter] = useState<Matter | null>(null)
  const [entities, setEntities] = useState<MatterEntity[]>([])
  const [relationships, setRelationships] = useState<MatterRelationship[]>([])
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null)
  const [insights, setInsights] = useState<PredictiveInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [matterContext, setMatterContext] = useState<string>("")

  useEffect(() => {
    if (id) {
      fetchMatterData(id as string)
    }
  }, [id])

  const fetchMatterData = async (matterId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cmf/matters/${matterId}`)

      if (response.ok) {
        const data = await response.json()
        setMatter(data.matter)
        setEntities(data.entities || [])
        setRelationships(data.relationships || [])
        setRiskAssessment(data.riskAssessment)
        setInsights(data.insights || [])
        setMatterContext(data.context || "")
      } else {
        console.error("Failed to fetch matter data")
      }
    } catch (error) {
      console.error("Error fetching matter data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleKnowledgeGraphQuery = async (query: string) => {
    try {
      const response = await fetch(`/api/cmf/matters/${id}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (response.ok) {
        const data = await response.json()
        setEntities(data.result.entities || [])
        setRelationships(data.result.relationships || [])
      }
    } catch (error) {
      console.error("Error querying knowledge graph:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Loading Matter..." />
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

  if (!matter) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Matter Not Found" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-2">Matter Not Found</h2>
                <p className="text-gray-600">
                  The matter you're looking for doesn't exist or you don't have access to it.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={`${matter.name} - CMF`} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* CMF Header */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Brain className="h-8 w-8" />
                  <div>
                    <h1 className="text-2xl font-bold">Cognitive Matter Fabric™</h1>
                    <p className="text-blue-100">The Living Brain of Your Legal Case</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {entities.length} Entities
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {relationships.length} Relationships
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    Risk: {matter.riskScore}/100
                  </Badge>
                </div>
              </div>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="knowledge-graph" className="flex items-center space-x-2">
                  <Network className="h-4 w-4" />
                  <span>Knowledge Graph</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Documents</span>
                </TabsTrigger>
                <TabsTrigger value="ai-chat" className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>AI Chat</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>Analytics</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <MatterDashboard
                  matter={matter}
                  riskAssessment={riskAssessment || undefined}
                  insights={insights}
                  financialData={{
                    budget: matter.budget,
                    billed: matter.billedAmount,
                    projected: matter.budget * 1.1,
                    burnRate: matter.billedAmount / 3, // Simplified calculation
                  }}
                />
              </TabsContent>

              <TabsContent value="knowledge-graph">
                <KnowledgeGraphViewer
                  matterId={matter.id}
                  entities={entities}
                  relationships={relationships}
                  onQuerySubmit={handleKnowledgeGraphQuery}
                />
              </TabsContent>

              <TabsContent value="documents">
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Document Repository</h3>
                  <p className="text-gray-600 mb-6">
                    Unified document repository with automatic processing, OCR, and metadata extraction.
                  </p>
                  <Button>Upload Documents</Button>
                </div>
              </TabsContent>

              <TabsContent value="ai-chat">
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Matter-Aware AI Chat</h3>
                  <p className="text-gray-600 mb-6">
                    Chat with AI that has persistent context and memory of this specific matter.
                  </p>
                  <div className="max-w-md mx-auto p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Current Context:</strong> {matterContext.substring(0, 200)}...
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
                  <p className="text-gray-600 mb-6">
                    Deep insights, predictive analytics, and pattern recognition for this matter.
                  </p>
                  <Button>Generate Analytics Report</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
