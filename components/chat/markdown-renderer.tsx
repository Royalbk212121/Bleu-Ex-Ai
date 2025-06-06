"use client"

import ReactMarkdown from "react-markdown"
import { CitationChip } from "./citation-chip"

interface MarkdownRendererProps {
  content: string
  citations: any[]
}

export function MarkdownRenderer({ content, citations }: MarkdownRendererProps) {
  // Process content to replace [citation:N] with citation chips
  const processContent = (text: string) => {
    const citationRegex = /\[citation:(\d+)\]/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = citationRegex.exec(text)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }

      // Add citation chip
      const citationNumber = Number.parseInt(match[1])
      const citation = citations.find((c) => c.number === citationNumber)

      if (citation) {
        parts.push(
          <CitationChip key={`citation-${citationNumber}`} citationNumber={citationNumber} citation={citation} />,
        )
      } else {
        // Fallback if citation not found
        parts.push(`[${citationNumber}]`)
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        components={{
          // Custom paragraph renderer to handle citations
          p: ({ children }) => {
            if (typeof children === "string") {
              const processedContent = processContent(children)
              return <p>{processedContent}</p>
            }
            return <p>{children}</p>
          },
          // Style other markdown elements
          h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{children}</h1>,
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">{children}</ol>
          ),
          li: ({ children }) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-gray-800 dark:text-gray-200">{children}</em>,
          code: ({ children }) => (
            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 py-2 rounded-r">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
