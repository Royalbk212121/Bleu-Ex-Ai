"use client"

import type React from "react"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Paperclip } from "lucide-react"
import { useRef, useEffect } from "react"

interface RichTextInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onFileUpload: () => void
  disabled?: boolean
  placeholder?: string
}

export function RichTextInput({ value, onChange, onFileUpload, disabled, placeholder }: RichTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      // Trigger form submission
      const form = e.currentTarget.closest("form")
      if (form) {
        form.requestSubmit()
      }
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[60px] max-h-[200px] resize-none pr-12 text-base border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
        rows={1}
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onFileUpload}
        className="absolute right-2 bottom-2 h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
        disabled={disabled}
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </div>
  )
}
