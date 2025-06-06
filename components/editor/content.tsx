"use client"

import { Card, CardContent } from "@/components/ui/card"

interface EditorContentProps {
  content: string
  setContent: (content: string) => void
}

export function EditorContent({ content, setContent }: EditorContentProps) {
  return (
    <div className="flex-1 p-6">
      <Card className="h-full">
        <CardContent className="p-6 h-full">
          <textarea
            placeholder="Start writing your legal document..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full resize-none border-none outline-none text-gray-700 leading-relaxed"
          />
        </CardContent>
      </Card>
    </div>
  )
}
