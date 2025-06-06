"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Bot, Copy, ThumbsUp, ThumbsDown } from "lucide-react"
import { MarkdownRenderer } from "./markdown-renderer"

interface ChatMessageProps {
  message: {
    id: string
    role: "user" | "assistant"
    content: string
  }
  citations: any[]
}

export function ChatMessage({ message, citations }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type)
    // Send feedback to backend
    console.log(`Feedback: ${type} for message ${message.id}`)
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-3xl">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-4xl w-full">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-full">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-3">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    Legal AI Assistant
                  </Badge>
                  <span className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</span>
                </div>

                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <MarkdownRenderer content={message.content} citations={citations} />
                </div>

                {citations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Sources cited:</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {citations.length} legal sources
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFeedback("up")}
                      className={`text-gray-500 hover:text-green-600 ${
                        feedback === "up" ? "text-green-600 bg-green-50" : ""
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFeedback("down")}
                      className={`text-gray-500 hover:text-red-600 ${
                        feedback === "down" ? "text-red-600 bg-red-50" : ""
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
