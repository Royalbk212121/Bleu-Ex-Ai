"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"
import Comment from "@tiptap/extension-comment"
import Suggestion from "@tiptap/extension-suggestion"
import { useAppSelector, useAppDispatch } from "@/lib/store"
import { updateContent, addComment, addSuggestion } from "@/lib/store/slices/documentSlice"
import { EditorToolbar } from "./editor-toolbar"
import { AIAssistantPanel } from "./ai-assistant-panel"
import { CollaborationPanel } from "./collaboration-panel"
import { CommentPanel } from "./comment-panel"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function AdvancedEditor() {
  const dispatch = useAppDispatch()
  const { activeDocument, collaborationMode } = useAppSelector((state) => state.document)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [selectedText, setSelectedText] = useState("")

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: activeDocument?.content || "",
      }),
      CollaborationCursor.configure({
        provider: null, // WebSocket provider would go here
      }),
      Comment.configure({
        HTMLAttributes: {
          class: "comment",
        },
      }),
      Suggestion.configure({
        HTMLAttributes: {
          class: "suggestion",
        },
      }),
    ],
    content: activeDocument?.content || "",
    onUpdate: ({ editor }) => {
      const content = editor.getHTML()
      dispatch(updateContent(content))
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const text = editor.state.doc.textBetween(from, to)
      setSelectedText(text)
    },
  })

  const handleAIAction = async (action: string) => {
    if (!selectedText) return

    try {
      const response = await fetch("/api/editor/ai-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: selectedText,
          context: activeDocument?.content,
        }),
      })

      const result = await response.json()

      if (action === "comment") {
        dispatch(
          addComment({
            id: Date.now().toString(),
            text: result.comment,
            author: "AI Assistant",
            position: editor?.state.selection.from || 0,
            resolved: false,
            createdAt: new Date().toISOString(),
          }),
        )
      } else if (action === "suggest") {
        dispatch(
          addSuggestion({
            id: Date.now().toString(),
            type: "replace",
            originalText: selectedText,
            suggestedText: result.suggestion,
            position: editor?.state.selection.from || 0,
            accepted: false,
            author: "AI Assistant",
            createdAt: new Date().toISOString(),
          }),
        )
      }
    } catch (error) {
      console.error("AI action failed:", error)
    }
  }

  if (!activeDocument) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">No Document Selected</h3>
          <p className="text-gray-600 mb-4">Select a document to start editing</p>
          <Button>Create New Document</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <EditorToolbar editor={editor} onAIAction={handleAIAction} selectedText={selectedText} />

        <div className="flex-1 p-6 overflow-auto">
          <Card className="h-full p-6">
            <EditorContent editor={editor} className="prose prose-lg max-w-none h-full" />
          </Card>
        </div>
      </div>

      {showAIPanel && (
        <AIAssistantPanel selectedText={selectedText} onAction={handleAIAction} onClose={() => setShowAIPanel(false)} />
      )}

      {collaborationMode && <CollaborationPanel />}

      <CommentPanel comments={activeDocument.comments || []} suggestions={activeDocument.suggestions || []} />
    </div>
  )
}
