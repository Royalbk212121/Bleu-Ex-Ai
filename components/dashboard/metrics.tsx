"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, MessageSquare, BookOpen, Clock, TrendingUp } from "lucide-react"

export function DashboardMetrics() {
  const metrics = [
    {
      title: "Documents Analyzed",
      value: "247",
      icon: FileText,
      trend: "+12%",
      period: "This month",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "AI Queries",
      value: "1,432",
      icon: MessageSquare,
      trend: "+23%",
      period: "This month",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Research Citations",
      value: "89",
      icon: BookOpen,
      trend: "+8%",
      period: "This week",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "Time Saved",
      value: "156h",
      icon: Clock,
      trend: "+31%",
      period: "This month",
      gradient: "from-orange-500 to-red-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="glass-card hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
            <div
              className={`p-2 rounded-lg bg-gradient-to-r ${metric.gradient} group-hover:scale-110 transition-transform duration-300`}
            >
              <metric.icon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-playfair mb-2">{metric.value}</div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              {metric.trend} {metric.period}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
