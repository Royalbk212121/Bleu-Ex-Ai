"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sparkles, Edit, BookOpen, Search, Circle } from "lucide-react"

export function AIAssistant() {
  const features = [
    {
      title: "Smart Writing Assistant",
      description: "Get AI suggestions as you write",
      icon: Edit,
      active: true,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Legal Citations",
      description: "Automatic citation formatting and verification",
      icon: BookOpen,
      active: true,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Grammar & Style",
      description: "Professional legal writing suggestions",
      icon: Sparkles,
      active: false,
      iconColor: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ]

  const actions = [
    { title: "Improve Writing", icon: Edit },
    { title: "Add Citation", icon: BookOpen },
    { title: "Legal Research", icon: Search },
  ]

  return (
    <div className="w-80 bg-white border-l flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">Get writing suggestions and legal insights</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Active Features */}
        <div>
          <h3 className="font-medium mb-3">Active Features</h3>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className={`flex items-center justify-between p-3 ${feature.bgColor} rounded-lg`}>
                <div className="flex items-center space-x-2">
                  <feature.icon className={`h-4 w-4 ${feature.iconColor}`} />
                  <div>
                    <p className="font-medium text-sm">{feature.title}</p>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </div>
                </div>
                <Circle
                  className={`h-2 w-2 ${
                    feature.active ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div>
          <h3 className="font-medium mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {actions.map((action, index) => (
              <Button key={index} variant="outline" size="sm" className="w-full justify-start">
                <action.icon className="h-4 w-4 mr-2" />
                {action.title}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Suggestions */}
        <div>
          <h3 className="font-medium mb-3">Suggestions</h3>
          <div className="text-center py-8">
            <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Start writing to see AI suggestions and improvements</p>
          </div>
        </div>
      </div>
    </div>
  )
}
