"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, TrendingUp, TrendingDown } from "lucide-react"

interface RiskItem {
  category: string
  level: "low" | "medium" | "high" | "critical"
  percentage: number
  count: number
  trend: "up" | "down" | "stable"
}

const riskData: RiskItem[] = [
  {
    category: "Contract Compliance",
    level: "high",
    percentage: 78,
    count: 23,
    trend: "up",
  },
  {
    category: "Regulatory Risk",
    level: "medium",
    percentage: 45,
    count: 12,
    trend: "down",
  },
  {
    category: "Litigation Exposure",
    level: "low",
    percentage: 23,
    count: 5,
    trend: "stable",
  },
  {
    category: "IP Infringement",
    level: "critical",
    percentage: 89,
    count: 8,
    trend: "up",
  },
  {
    category: "Data Privacy",
    level: "medium",
    percentage: 56,
    count: 15,
    trend: "down",
  },
]

const getRiskColor = (level: string) => {
  switch (level) {
    case "low":
      return "text-green-600 bg-green-50"
    case "medium":
      return "text-yellow-600 bg-yellow-50"
    case "high":
      return "text-orange-600 bg-orange-50"
    case "critical":
      return "text-red-600 bg-red-50"
    default:
      return "text-gray-600 bg-gray-50"
  }
}

const getProgressColor = (level: string) => {
  switch (level) {
    case "low":
      return "bg-green-500"
    case "medium":
      return "bg-yellow-500"
    case "high":
      return "bg-orange-500"
    case "critical":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-3 w-3 text-red-500" />
    case "down":
      return <TrendingDown className="h-3 w-3 text-green-500" />
    default:
      return <Shield className="h-3 w-3 text-gray-500" />
  }
}

export function RiskDistribution() {
  const totalRisks = riskData.reduce((sum, item) => sum + item.count, 0)
  const criticalRisks = riskData.filter((item) => item.level === "critical").length
  const highRisks = riskData.filter((item) => item.level === "high").length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Risk Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalRisks}</div>
            <div className="text-sm text-gray-600">Total Risks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{criticalRisks}</div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{highRisks}</div>
            <div className="text-sm text-gray-600">High Risk</div>
          </div>
        </div>

        {/* Risk Categories */}
        <div className="space-y-4">
          {riskData.map((risk, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{risk.category}</span>
                  {getTrendIcon(risk.trend)}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={getRiskColor(risk.level)}>
                    {risk.level.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-600">{risk.count} issues</span>
                </div>
              </div>
              <div className="space-y-1">
                <Progress value={risk.percentage} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Risk Level</span>
                  <span>{risk.percentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Risk Level Legend */}
        <div className="pt-4 border-t">
          <div className="text-sm font-medium mb-2">Risk Levels</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Low (0-25%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Medium (26-50%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>High (51-75%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Critical (76-100%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
