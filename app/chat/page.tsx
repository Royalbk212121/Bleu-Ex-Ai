"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { EnhancedChatInterface } from "@/components/chat/enhanced-chat-interface"

export default function ChatPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="AI Chat Assistant" />
        <main className="flex-1 overflow-hidden">
          <EnhancedChatInterface />
        </main>
      </div>
    </div>
  )
}
