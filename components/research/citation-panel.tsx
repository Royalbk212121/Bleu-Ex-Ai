"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, ExternalLink, Copy, Scale, Bookmark, BarChart2, FileText } from "lucide-react"

interface Citation {
  id: string
  text: string
  similarity: number
  metadata: {
    section: string
    citations: string[]
    interpretation?: string
    reasoning?: string
  }
  source: {
    title: string
    jurisdiction: string
    area: string
    documentType: string
    provider: string
    year?: number
    court?: string
  }
}

interface CitationPanelProps {
  citations: Citation[]
}

export function CitationPanel({ citations }: CitationPanelProps) {
  const [activeTab, setActiveTab] = useState("sources")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="w-96 bg-white dark:bg-gray-900 border-l border-border flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold">Legal Sources</h2>
          </div>
          <Badge variant="outline">{citations.length} sources</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 border-b">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="sources" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>Sources</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-1">
              <Scale className="h-4 w-4" />
              <span>Analysis</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sources" className="flex-1 overflow-hidden flex flex-col mt-0 p-0">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {citations.map((citation, index) => (
                <Card key={citation.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">{citation.source.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {citation.source.area}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {citation.source.jurisdiction}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">#{index + 1}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-gray-700">Section: {citation.metadata.section}</p>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              citation.similarity > 0.8
                                ? "bg-green-50 text-green-700 border-green-200"
                                : citation.similarity > 0.6
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            <BarChart2 className="h-3 w-3 mr-1" />
                            {Math.round(citation.similarity * 100)}% relevant
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3">{citation.text}</p>
                      </div>

                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-medium text-gray-700 mb-1">Source:</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
                              {citation.source.provider || "Internal"}
                            </Badge>
                            {citation.source.year && (
                              <span className="text-xs text-gray-500">{citation.source.year}</span>
                            )}
                            {citation.source.court && (
                              <span className="text-xs text-gray-500">{citation.source.court}</span>
                            )}
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>

                      {citation.metadata.citations.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-xs font-medium text-gray-700 mb-1">Legal Citations:</p>
                          <div className="space-y-1">
                            {citation.metadata.citations.map((cite, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="font-mono text-gray-600">{cite}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(cite)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="analysis" className="flex-1 overflow-hidden flex flex-col mt-0 p-0">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {citations.map((citation, index) => (
                <Card key={`analysis-${citation.id}`} className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">{citation.source.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {citation.source.documentType}
                          </Badge>
                          {citation.source.year && (
                            <Badge variant="secondary" className="text-xs">
                              {citation.source.year}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">
                          Legal Interpretation:
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-md">
                          {citation.metadata.interpretation ||
                            "This case establishes precedent for interpreting the legal principles in question. The court's reasoning provides guidance on how similar situations should be handled in the future."}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                          Why This Source Was Selected:
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                          {citation.metadata.reasoning ||
                            `This source was selected because it has ${Math.round(citation.similarity * 100)}% relevance to your query. It contains key legal principles and precedents that directly address the legal questions you've raised.`}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {citation.source.documentType} • {citation.source.jurisdiction}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            citation.similarity > 0.8
                              ? "bg-green-50 text-green-700 border-green-200"
                              : citation.similarity > 0.6
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {Math.round(citation.similarity * 100)}% relevant
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
