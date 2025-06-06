"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { AgentSwarmInterface } from "@/components/agents/agent-swarm-interface"

export default function AgentsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Agent Swarm" />
        <main className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            <div className="max-w-7xl mx-auto h-full">
              <div className="mb-6">
                <h1 className="text-2xl font-bold">AI Agent Swarm</h1>
                <p className="text-gray-600">Collaborative AI agents for complex legal tasks</p>
              </div>
              <AgentSwarmInterface />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
