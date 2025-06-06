"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, MessageSquare, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ChatSession {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  messageCount: number
}

interface MessageHistoryProps {
  sessions: ChatSession[]
  currentSessionId: string
  onSessionSelect: (sessionId: string) => void
  onSessionDelete: (sessionId: string) => void
}

export function MessageHistory({ sessions, currentSessionId, onSessionSelect, onSessionDelete }: MessageHistoryProps) {
  return (
    <div className="p-4 space-y-3">
      {sessions.map((session) => (
        <Card
          key={session.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            session.id === currentSessionId
              ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
          onClick={() => onSessionSelect(session.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{session.title}</h3>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                  {session.lastMessage || "No messages yet"}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(session.timestamp, { addSuffix: true })}
                    </span>
                  </div>

                  <Badge variant="secondary" className="text-xs">
                    {session.messageCount} msgs
                  </Badge>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-8 w-8 p-0 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  onSessionDelete(session.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {sessions.length === 0 && (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No chat sessions yet</p>
          <p className="text-xs text-gray-400 mt-1">Start a conversation to see your history</p>
        </div>
      )}
    </div>
  )
}
