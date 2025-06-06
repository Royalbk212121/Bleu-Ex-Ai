"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

export function RecentAnalyses() {
  const analyses = [
    {
      title: "Employment Agreement Review",
      type: "Contract Analysis",
      status: "completed",
      risk: "medium",
      issues: 3,
      time: "2 hours ago",
    },
    {
      title: "Discovery Document Batch #45",
      type: "Privilege Review",
      status: "in-progress",
      risk: "high",
      issues: 7,
      time: "Processing...",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Recent Analyses</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {analyses.map((analysis, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{analysis.title}</h3>
              <Badge
                variant={analysis.status === "completed" ? "default" : "secondary"}
                className={
                  analysis.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                }
              >
                {analysis.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2">{analysis.type}</p>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Badge
                  variant="secondary"
                  className={analysis.risk === "high" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}
                >
                  {analysis.risk} risk
                </Badge>
                <span className="text-sm text-gray-600">{analysis.issues} issues</span>
              </div>
              <span className="text-sm text-gray-500">{analysis.time}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
