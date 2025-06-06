"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Network, Search, Filter, Zap, Database, Brain } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default function KnowledgeGraphPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const concepts = [
    { id: "1", name: "Contract Law", connections: 15, type: "primary" },
    { id: "2", name: "Tort Law", connections: 12, type: "primary" },
    { id: "3", name: "Constitutional Law", connections: 20, type: "primary" },
    { id: "4", name: "Employment Law", connections: 8, type: "secondary" },
    { id: "5", name: "Intellectual Property", connections: 10, type: "secondary" },
    { id: "6", name: "Corporate Law", connections: 14, type: "primary" },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Knowledge Graph" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">Legal Knowledge Graph</h1>
                <p className="text-gray-600">Explore interconnected legal concepts and relationships</p>
              </div>
              <Button className="bg-black hover:bg-gray-800">
                <Zap className="h-4 w-4 mr-2" />
                Generate Insights
              </Button>
            </div>

            {/* Search and Controls */}
            <Card>
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search legal concepts, cases, statutes..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Graph Visualization */}
              <div className="lg:col-span-2">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Network className="h-5 w-5 mr-2" />
                      Knowledge Graph Visualization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full">
                    <div className="h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Network className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Interactive Knowledge Graph</h3>
                        <p className="text-gray-600">
                          Explore legal concepts and their relationships in an interactive visualization
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Concept Explorer */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      Legal Concepts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {concepts.map((concept) => (
                        <div
                          key={concept.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedNode === concept.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedNode(concept.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{concept.name}</span>
                            <Badge variant={concept.type === "primary" ? "default" : "secondary"}>
                              {concept.connections}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Database className="h-5 w-5 mr-2" />
                      Graph Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Concepts</span>
                        <span className="font-medium">1,247</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Relationships</span>
                        <span className="font-medium">3,891</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Legal Areas</span>
                        <span className="font-medium">23</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated</span>
                        <span className="font-medium">2 hours ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
