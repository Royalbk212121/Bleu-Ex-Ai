"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ExternalLink, Calendar, MapPin, Scale, Copy } from "lucide-react"

interface Citation {
  id: string
  number: number
  title: string
  court: string
  date: string
  jurisdiction: string
  url: string
  summary: string
  caseType: string
}

interface CitationChipProps {
  citationNumber: number
  citation: Citation
}

export function CitationChip({ citationNumber, citation }: CitationChipProps) {
  const [isOpen, setIsOpen] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatCitation = () => {
    return `${citation.title}, ${citation.court} (${citation.date})`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200 text-blue-700 border-blue-200 bg-blue-50/50 ml-1 text-xs font-medium"
        >
          [{citationNumber}]
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{citation.title}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {citation.caseType}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Citation #{citationNumber}
                </Badge>
              </div>
            </div>
          </div>

          {/* Case Details */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Scale className="h-4 w-4" />
              <span className="font-medium">{citation.court}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>{citation.date}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4" />
              <span>{citation.jurisdiction}</span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{citation.summary}</p>
          </div>

          {/* Formatted Citation */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Formatted Citation:</p>
                <p className="text-sm font-mono text-gray-800 dark:text-gray-200">{formatCitation()}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(formatCitation())} className="ml-2">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(citation.url, "_blank")}
              className="flex items-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View Full Text</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
