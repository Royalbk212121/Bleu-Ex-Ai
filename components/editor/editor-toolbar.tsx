"use client"

import type { Editor } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Bold, Italic, List, ListOrdered, Undo, Redo, Sparkles, MessageSquare, Search, FileText } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface EditorToolbarProps {
  editor: Editor | null
  onAIAction: (action: string) => void
  selectedText: string
}

export function EditorToolbar({ editor, onAIAction, selectedText }: EditorToolbarProps) {
  if (!editor) return null

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center space-x-2">
        {/* Basic formatting */}
        <Button
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <Button
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* AI Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedText}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onAIAction("summarize")}>
              <FileText className="h-4 w-4 mr-2" />
              Summarize
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAIAction("find-cases")}>
              <Search className="h-4 w-4 mr-2" />
              Find Supporting Cases
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAIAction("suggest")}>
              <Sparkles className="h-4 w-4 mr-2" />
              Suggest Improvements
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAIAction("comment")}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Add AI Comment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
