"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Search, Download, Database, Globe, FileText } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default function LegalSourcesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const sources = [
    { id: 1, name: "Federal Court Decisions", type: "cases", count: "2.3M", status: "active" },
    { id: 2, name: "State Statutes", type: "statutes", count: "890K", status: "active" },
    { id: 3, name: "Federal Regulations", type: "regulations", count: "1.2M", status: "active" },
    { id: 4, name: "Law Reviews", type: "secondary", count: "450K", status: "active" },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Legal Sources" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">Legal Sources</h1>
                <p className="text-gray-600">Access comprehensive legal databases and resources</p>
              </div>
              <Button className="bg-black hover:bg-gray-800">
                <Download className="h-4 w-4 mr-2" />
                Sync Sources
              </Button>
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search across all legal sources..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button>Search</Button>
                </div>
              </CardContent>
            </Card>

            {/* Source Categories */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All Sources</TabsTrigger>
                <TabsTrigger value="cases">Case Law</TabsTrigger>
                <TabsTrigger value="statutes">Statutes</TabsTrigger>
                <TabsTrigger value="regulations">Regulations</TabsTrigger>
                <TabsTrigger value="secondary">Secondary</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {sources.map((source) => (
                    <Card key={source.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            {source.type === "cases" && <FileText className="h-5 w-5 text-blue-600" />}
                            {source.type === "statutes" && <BookOpen className="h-5 w-5 text-blue-600" />}
                            {source.type === "regulations" && <Database className="h-5 w-5 text-blue-600" />}
                            {source.type === "secondary" && <Globe className="h-5 w-5 text-blue-600" />}
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {source.status}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{source.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Documents</span>
                          <span className="font-semibold">{source.count}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="cases" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Case Law Databases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Access federal and state court decisions</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="statutes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Statutory Databases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Browse federal and state statutes</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="regulations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Regulatory Databases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Explore federal and state regulations</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="secondary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Secondary Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Access law reviews, treatises, and commentary</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
