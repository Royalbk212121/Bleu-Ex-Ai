"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { EditorToolbar } from "@/components/editor/toolbar"
import { EditorContent } from "@/components/editor/content"
import { AIAssistant } from "@/components/editor/ai-assistant"

export default function DocumentEditor() {
  const [content, setContent] = useState("")

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Document Editor" />
        <main className="flex-1 overflow-hidden flex">
          {/* Editor Area */}
          <div className="flex-1 flex flex-col">
            {/* Editor Header */}
            <EditorToolbar />

            {/* Editor Content */}
            <EditorContent content={content} setContent={setContent} />
          </div>

          {/* AI Assistant Sidebar */}
          <AIAssistant />
        </main>
      </div>
    </div>
  )
}
