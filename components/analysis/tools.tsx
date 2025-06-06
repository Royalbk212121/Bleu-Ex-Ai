"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Shield, BarChart3 } from "lucide-react"

export function AnalysisTools() {
  const tools = [
    {
      title: "Contract Analysis",
      description: "Review terms and identify risks",
      icon: FileText,
      iconColor: "text-blue-600",
    },
    {
      title: "Privilege Review",
      description: "Automated privilege classification",
      icon: Shield,
      iconColor: "text-green-600",
    },
    {
      title: "Bulk Analysis",
      description: "Process multiple documents",
      icon: BarChart3,
      iconColor: "text-purple-600",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            >
              <tool.icon className={`h-12 w-12 ${tool.iconColor} mx-auto mb-4`} />
              <h3 className="font-medium mb-2">{tool.title}</h3>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
