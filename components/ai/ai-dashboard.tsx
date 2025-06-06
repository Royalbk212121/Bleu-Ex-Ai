"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, Clock, Zap, Brain, Search, Shield } from "lucide-react"

interface AIHealthStatus {
  status: "healthy" | "degraded" | "unhealthy"
  services: {
    llm: Record<string, boolean>
    embedding: Record<string, boolean>
    rag: boolean
    ml: Record<string, boolean>
  }
  usage: Record<string, any>
  cache: Record<string, any>
  classification: Record<string, any>
  timestamp: string
}

export function AIDashboard() {
  const [healthStatus, setHealthStatus] = useState<AIHealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    fetchHealthStatus()
    const interval = setInterval(fetchHealthStatus, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch("/api/ai/health")
      const data = await response.json()
      setHealthStatus(data)
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Failed to fetch AI health status:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600"
      case "degraded":
        return "text-yellow-600"
      case "unhealthy":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "unhealthy":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">AI Infrastructure</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Infrastructure</h2>
          <p className="text-muted-foreground">Monitor and manage AI services, models, and performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={healthStatus?.status === "healthy" ? "default" : "destructive"}>
            {healthStatus?.status || "Unknown"}
          </Badge>
          <Button onClick={fetchHealthStatus} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LLM Services</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus?.services.llm ? Object.values(healthStatus.services.llm).filter(Boolean).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {healthStatus?.services.llm ? Object.keys(healthStatus.services.llm).length : 0} models active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RAG System</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {healthStatus?.services.rag ? (
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
              )}
              {healthStatus?.services.rag ? "Active" : "Inactive"}
            </div>
            <p className="text-xs text-muted-foreground">Retrieval-augmented generation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ML Models</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus?.services.ml ? Object.values(healthStatus.services.ml).filter(Boolean).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">Custom models deployed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classifications</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus?.classification?.totalClassified || 0}</div>
            <p className="text-xs text-muted-foreground">Documents classified</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* LLM Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  LLM Services
                </CardTitle>
                <CardDescription>Language model availability and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthStatus?.services.llm &&
                  Object.entries(healthStatus.services.llm).map(([model, status]) => (
                    <div key={model} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{model}</span>
                      <div className="flex items-center">
                        {status ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={status ? "default" : "destructive"} className="ml-2">
                          {status ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Embedding Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Embedding Services
                </CardTitle>
                <CardDescription>Vector embedding model status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthStatus?.services.embedding &&
                  Object.entries(healthStatus.services.embedding).map(([model, status]) => (
                    <div key={model} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{model}</span>
                      <div className="flex items-center">
                        {status ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={status ? "default" : "destructive"} className="ml-2">
                          {status ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* RAG Service */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  RAG & Anti-Hallucination
                </CardTitle>
                <CardDescription>Retrieval-augmented generation status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">RAG Service</span>
                  <div className="flex items-center">
                    {healthStatus?.services.rag ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <Badge variant={healthStatus?.services.rag ? "default" : "destructive"} className="ml-2">
                      {healthStatus?.services.rag ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ML Models */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  ML Models
                </CardTitle>
                <CardDescription>Custom machine learning models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthStatus?.services.ml &&
                  Object.entries(healthStatus.services.ml).map(([model, status]) => (
                    <div key={model} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{model}</span>
                      <div className="flex items-center">
                        {status ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={status ? "default" : "destructive"} className="ml-2">
                          {status ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Token Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
                <CardDescription>Current token consumption by model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthStatus?.usage &&
                  Object.entries(healthStatus.usage).map(([model, data]: [string, any]) => (
                    <div key={model} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{model}</span>
                        <span className="text-sm text-muted-foreground">
                          {data.tokens?.toLocaleString() || 0} tokens
                        </span>
                      </div>
                      <Progress value={(data.tokens || 0) / 1000} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{data.requests || 0} requests</span>
                        <span>${(data.cost || 0).toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Cache Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
                <CardDescription>Embedding cache statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cache Size</span>
                    <span className="text-sm text-muted-foreground">
                      {healthStatus?.cache?.size || 0} / {healthStatus?.cache?.maxSize || 0}
                    </span>
                  </div>
                  <Progress
                    value={((healthStatus?.cache?.size || 0) / (healthStatus?.cache?.maxSize || 1)) * 100}
                    className="h-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hit Rate</span>
                  <span className="text-sm text-muted-foreground">{healthStatus?.cache?.hitRate || "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Classification Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Document Classification</CardTitle>
                <CardDescription>ML model classification statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Classified</span>
                  <span className="text-2xl font-bold">{healthStatus?.classification?.totalClassified || 0}</span>
                </div>
                {healthStatus?.classification?.byClassification && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">By Classification</h4>
                    {Object.entries(healthStatus.classification.byClassification).map(
                      ([type, count]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground capitalize">{type}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Overall AI infrastructure health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Status</span>
                  <div className="flex items-center">
                    {getStatusIcon(healthStatus?.status || "unknown")}
                    <span className={`ml-2 text-sm font-medium ${getStatusColor(healthStatus?.status || "unknown")}`}>
                      {healthStatus?.status || "Unknown"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-sm text-muted-foreground">{lastRefresh.toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <Badge variant="outline">99.9%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
