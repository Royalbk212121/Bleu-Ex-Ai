"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Sparkles, Search, FileText, MessageSquare } from "lucide-react"

interface AIAssistantPanelProps {
  selectedText: string
  onAction: (action: string) => void
  onClose: () => void
}

export function AIAssistantPanel({ selectedText, onAction, onClose }: AIAssistantPanelProps) {
  const [customPrompt, setCustomPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const quickActions = [
    {
      id: "summarize",
      label: "Summarize",
      icon: FileText,
      description: "Create a concise summary of the selected text",
    },
    {
      id: "find-cases",
      label: "Find Cases",
      icon: Search,
      description: "Search for relevant case law and precedents",
    },
    {
      id: "improve",
      label: "Improve Writing",
      icon: Sparkles,
      description: "Suggest improvements for clarity and precision",
    },
    {
      id: "analyze-risk",
      label: "Analyze Risk",
      icon: MessageSquare,
      description: "Identify potential legal risks and issues",
    },
  ]

  const handleAction = async (actionId: string) => {
    setIsLoading(true)
    try {
      await onAction(actionId)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <Card className="h-full rounded-none border-0">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
              AI Assistant
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {selectedText && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Selected Text</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 max-h-20 overflow-y-auto">
                {selectedText.substring(0, 200)}
                {selectedText.length > 200 && "..."}
              </div>
              <Badge variant="secondary" className="mt-2">
                {selectedText.length} characters
              </Badge>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Quick Actions</h4>
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="w-full justify-start h-auto p-3"
                onClick={() => handleAction(action.id)}
                disabled={!selectedText || isLoading}
              >
                <action.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Custom Request</h4>
            <Textarea
              placeholder="Ask the AI to help with specific legal analysis..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              className="w-full"
              onClick={() => handleAction("custom")}
              disabled={!customPrompt.trim() || isLoading}
            >
              {isLoading ? "Processing..." : "Send Request"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
