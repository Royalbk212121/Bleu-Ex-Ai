"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "ai/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, Paperclip, MessageSquare, Clock, Zap, FileText, Scale, BookOpen } from "lucide-react"
import { ChatMessage } from "./chat-message"

interface LegalSource {
  id: number
  caseName: string
  court: string
  date: string
  url: string
  jurisdiction: string
  documentType: string
  relevanceScore: number
  excerpt: string
}

export function EnhancedChatInterface() {
  const [sessionId] = useState(() => crypto.randomUUID())
  const [sources, setSources] = useState<LegalSource[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/v1/chat/query",
    body: { sessionId },
    onResponse: (response) => {
      // Extract sources from response headers
      const sourcesHeader = response.headers.get("X-Sources")
      if (sourcesHeader) {
        try {
          const parsedSources = JSON.parse(sourcesHeader)
          setSources(parsedSources)
        } catch (error) {
          console.error("Failed to parse sources:", error)
        }
      }
    },
  })

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new EventSource(`/api/v1/chat/websocket?sessionId=${sessionId}`)

    ws.onopen = () => {
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "connection") {
          console.log("WebSocket connected:", data.message)
        }
      } catch (error) {
        console.error("WebSocket message error:", error)
      }
    }

    ws.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [sessionId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const suggestedQuestions = [
    "What are my rights during a police stop?",
    "How do I file a small claims court case?",
    "What is the difference between a misdemeanor and felony?",
    "Can my landlord evict me without notice?",
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Message History Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Scale className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Legal AI Chat</h2>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-xs text-gray-500">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Sessions</div>
            <Card className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-start space-x-2">
                <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">Current Session</div>
                  <div className="text-xs text-gray-500 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Active now</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </ScrollArea>

        {/* Sources Panel */}
        {sources.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Legal Sources ({sources.length})
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {sources.map((source) => (
                <Card key={source.id} className="p-2">
                  <div className="text-xs font-medium text-gray-900 dark:text-white truncate">{source.caseName}</div>
                  <div className="text-xs text-gray-500">
                    {source.court} • {source.date}
                  </div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {Math.round(source.relevanceScore * 100)}% relevant
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Legal Research Assistant</h1>
                <p className="text-sm text-gray-500">
                  Ask legal questions and get answers with authoritative citations
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Zap className="h-3 w-3 mr-1" />
                RAG Enabled
              </Badge>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                  <Scale className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to Legal AI Assistant
                </h3>
                <p className="text-gray-500 mb-6">
                  Ask any legal question and get comprehensive answers with citations to authoritative sources.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left h-auto p-3 justify-start"
                      onClick={() => {
                        handleInputChange({ target: { value: question } } as any)
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{question}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => <ChatMessage key={message.id} message={message} citations={sources} />)
            )}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-500">AI is researching legal sources...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask a legal question... (Press Enter to send, Shift+Enter for new line)"
                className="min-h-[60px] max-h-[200px] resize-none pr-20 text-base"
                disabled={isLoading}
              />
              <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                <Button type="button" variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Powered by RAG (Retrieval-Augmented Generation)</span>
              <span>{input.length}/2000 characters</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
