"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Shield, CheckCircle, AlertTriangle } from "lucide-react"

export function AnalysisStats() {
  const stats = [
    {
      title: "Total Documents",
      value: "247",
      icon: FileText,
      iconColor: "text-blue-600",
    },
    {
      title: "Privileged Docs",
      value: "89",
      icon: Shield,
      iconColor: "text-green-600",
    },
    {
      title: "Review Completed",
      value: "156",
      icon: CheckCircle,
      iconColor: "text-purple-600",
    },
    {
      title: "Risk Issues",
      value: "23",
      icon: AlertTriangle,
      iconColor: "text-red-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
