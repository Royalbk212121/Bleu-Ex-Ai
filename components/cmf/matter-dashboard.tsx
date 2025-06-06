"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Users,
  Brain,
  Zap,
  Target,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import type { Matter, RiskAssessment, PredictiveInsight } from "@/lib/cmf/cognitive-matter-fabric"

interface MatterDashboardProps {
  matter: Matter
  riskAssessment?: RiskAssessment
  insights?: PredictiveInsight[]
  financialData?: {
    budget: number
    billed: number
    projected: number
    burnRate: number
  }
}

export function MatterDashboard({ matter, riskAssessment, insights = [], financialData }: MatterDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d")

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600 bg-red-50"
    if (score >= 60) return "text-orange-600 bg-orange-50"
    if (score >= 40) return "text-yellow-600 bg-yellow-50"
    return "text-green-600 bg-green-50"
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "high":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const criticalInsights = insights.filter((i) => i.priority === "critical")
  const highInsights = insights.filter((i) => i.priority === "high")

  return (
    <div className="space-y-6">
      {/* Matter Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{matter.name}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant="outline">{matter.matterNumber}</Badge>
            <Badge className={matter.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {matter.status}
            </Badge>
            <Badge variant="secondary">{matter.matterType}</Badge>
            <span className="text-gray-600">{matter.client}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Brain className="h-4 w-4 mr-2" />
            Query Knowledge Graph
          </Button>
          <Button>
            <Zap className="h-4 w-4 mr-2" />
            Generate Insights
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {(criticalInsights.length > 0 || highInsights.length > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Critical Alerts & High Priority Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-red-200"
                >
                  {getPriorityIcon(insight.priority)}
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900">{insight.title}</h4>
                    <p className="text-sm text-red-700 mt-1">{insight.description}</p>
                    {insight.recommendedActions.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-red-800">Recommended Actions:</span>
                        <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                          {insight.recommendedActions.slice(0, 2).map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(insight.confidence * 100)}% confidence
                  </Badge>
                </div>
              ))}
              {highInsights.slice(0, 2).map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-orange-200"
                >
                  {getPriorityIcon(insight.priority)}
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-900">{insight.title}</h4>
                    <p className="text-sm text-orange-700 mt-1">{insight.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(insight.confidence * 100)}% confidence
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Risk Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{matter.riskScore}/100</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={getRiskColor(matter.riskScore)}>
                {matter.riskScore >= 80
                  ? "Critical"
                  : matter.riskScore >= 60
                    ? "High"
                    : matter.riskScore >= 40
                      ? "Medium"
                      : "Low"}
              </Badge>
              {riskAssessment?.trends && riskAssessment.trends.length > 1 && (
                <div className="flex items-center text-xs">
                  {riskAssessment.trends[riskAssessment.trends.length - 1].score >
                  riskAssessment.trends[riskAssessment.trends.length - 2].score ? (
                    <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  <span className="text-muted-foreground">vs last update</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${(matter.billedAmount / 1000).toFixed(0)}K</div>
            <div className="text-xs text-muted-foreground">of ${(matter.budget / 1000).toFixed(0)}K budget</div>
            <Progress value={(matter.billedAmount / matter.budget) * 100} className="mt-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{Math.round((matter.billedAmount / matter.budget) * 100)}% used</span>
              <span>${((matter.budget - matter.billedAmount) / 1000).toFixed(0)}K remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* Team Size */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{matter.assignedAttorneys.length}</div>
            <div className="text-xs text-muted-foreground">attorneys assigned</div>
            <div className="mt-2">
              <div className="text-sm font-medium">Lead: {matter.leadAttorney}</div>
            </div>
          </CardContent>
        </Card>

        {/* Active Insights */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.length}</div>
            <div className="text-xs text-muted-foreground">
              {criticalInsights.length} critical, {highInsights.length} high priority
            </div>
            <div className="flex space-x-1 mt-2">
              {criticalInsights.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalInsights.length} critical
                </Badge>
              )}
              {highInsights.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {highInsights.length} high
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights & Alerts</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Matter Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {matter.objectives?.map((objective, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">{objective}</span>
                    </div>
                  )) || <p className="text-gray-500">No objectives defined</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {matter.keyIssues?.map((issue, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                      <span className="text-sm">{issue}</span>
                    </div>
                  )) || <p className="text-gray-500">No key issues identified</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Matter Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{matter.description || "No description provided"}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          {riskAssessment ? (
            <div className="grid lg:grid-cols-2 gap-6">
              {Object.entries(riskAssessment.categories).map(([category, data]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize">{category} Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold">{data.score}/100</span>
                      <Badge className={getRiskColor(data.score)}>
                        {data.score >= 80
                          ? "Critical"
                          : data.score >= 60
                            ? "High"
                            : data.score >= 40
                              ? "Medium"
                              : "Low"}
                      </Badge>
                    </div>
                    <Progress value={data.score} className="mb-4" />
                    <div className="space-y-2">
                      {data.factors.slice(0, 3).map((factor, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium">{factor.factor}</div>
                          <div className="text-gray-600">{factor.description}</div>
                          <div className="flex space-x-4 text-xs text-gray-500 mt-1">
                            <span>Impact: {factor.impact}/10</span>
                            <span>Likelihood: {factor.likelihood}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Risk Assessment Available</h3>
                <p className="text-gray-600 mb-4">Risk assessment is being generated for this matter.</p>
                <Button>Generate Risk Assessment</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {insights.length > 0 ? (
              insights.map((insight) => (
                <Card
                  key={insight.id}
                  className={
                    insight.priority === "critical"
                      ? "border-red-200"
                      : insight.priority === "high"
                        ? "border-orange-200"
                        : insight.priority === "medium"
                          ? "border-yellow-200"
                          : "border-gray-200"
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getPriorityIcon(insight.priority)}
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{insight.type.replace("_", " ")}</Badge>
                        <Badge variant="secondary">{Math.round(insight.confidence * 100)}% confidence</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{insight.description}</p>

                    {insight.recommendedActions.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Recommended Actions:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {insight.recommendedActions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insight.evidence.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Supporting Evidence:</h4>
                        <div className="space-y-2">
                          {insight.evidence.map((evidence, idx) => (
                            <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                              <div className="font-medium">{evidence.source}</div>
                              <div className="text-gray-600">{evidence.summary}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Relevance: {Math.round(evidence.relevance * 100)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Created: {new Date(insight.createdAt).toLocaleDateString()}</span>
                      {insight.expiresAt && <span>Expires: {new Date(insight.expiresAt).toLocaleDateString()}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Insights</h3>
                  <p className="text-gray-600 mb-4">AI insights will appear here as the matter develops.</p>
                  <Button>Generate Insights</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Total Budget</span>
                      <span className="font-medium">${matter.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Billed Amount</span>
                      <span className="font-medium">${matter.billedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Remaining</span>
                      <span className="font-medium">${(matter.budget - matter.billedAmount).toLocaleString()}</span>
                    </div>
                  </div>
                  <Progress value={(matter.billedAmount / matter.budget) * 100} />
                  <div className="text-center text-sm text-gray-600">
                    {Math.round((matter.billedAmount / matter.budget) * 100)}% of budget used
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Burn Rate Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    ${financialData?.burnRate?.toLocaleString() || "0"}/month
                  </div>
                  <div className="text-sm text-gray-600 mt-2">Current burn rate</div>
                  {financialData?.projected && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                      <div className="text-sm font-medium text-yellow-800">Projected completion cost</div>
                      <div className="text-lg font-bold text-yellow-900">
                        ${financialData.projected.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Attorney Time</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expenses</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>External Costs</span>
                    <span className="font-medium">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matter Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 border-l-4 border-blue-500 bg-blue-50">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Matter Opened</div>
                    <div className="text-sm text-gray-600">{new Date(matter.openDate).toLocaleDateString()}</div>
                  </div>
                </div>

                {matter.targetCloseDate && (
                  <div className="flex items-center space-x-4 p-3 border-l-4 border-green-500 bg-green-50">
                    <Target className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">Target Close Date</div>
                      <div className="text-sm text-gray-600">
                        {new Date(matter.targetCloseDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Detailed timeline events will appear here as they are added to the matter.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
