"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, FileText, MessageSquare, CheckCircle, AlertCircle } from "lucide-react"

export function RecentActivity() {
  const activities = [
    {
      type: "document",
      title: "Contract Review - ABC Corp",
      description: "AI analysis completed with 3 risk factors identified",
      time: "2 hours ago",
      status: "completed",
      icon: FileText,
    },
    {
      type: "research",
      title: "Case Law Research",
      description: "Found 12 relevant precedents for intellectual property case",
      time: "4 hours ago",
      status: "completed",
      icon: MessageSquare,
    },
    {
      type: "document",
      title: "Document Classification",
      description: "Processed 45 discovery documents for privilege review",
      time: "1 day ago",
      status: "pending",
      icon: FileText,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Recent Activity</span>
        </CardTitle>
        <p className="text-sm text-gray-600">Your latest legal AI interactions</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <activity.icon className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium">{activity.title}</p>
              <p className="text-sm text-gray-600">{activity.description}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">{activity.time}</span>
                {activity.status === "completed" ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
