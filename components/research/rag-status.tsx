"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Database, BookOpen, Sparkles } from "lucide-react"

interface RAGStatusProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export function RAGStatus({ enabled, onToggle }: RAGStatusProps) {
  return (
    <Card className="glass-card border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 legal-gradient rounded-xl flex items-center justify-center">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-semibold font-playfair">RAG Enhancement</h3>
                <Badge variant={enabled ? "default" : "secondary"} className="text-xs">
                  {enabled ? "Active" : "Disabled"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {enabled
                  ? "Searching legal database for relevant sources"
                  : "Using standard AI responses without database search"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span className="text-green-600 dark:text-green-400 font-medium">Legal Sources</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-purple-600 dark:text-purple-400 font-medium">AI Enhanced</span>
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={onToggle} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
