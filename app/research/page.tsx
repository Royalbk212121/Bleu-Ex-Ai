"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, BookOpen, Database, Brain } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default function ResearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    // Simulate search
    setTimeout(() => {
      setIsSearching(false)
    }, 2000)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Legal Research" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold">Legal Research</h1>
              <p className="text-gray-600">AI-powered legal research and case analysis</p>
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search legal cases, statutes, regulations..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Research Tools */}
            <Tabs defaultValue="cases" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cases">Case Law</TabsTrigger>
                <TabsTrigger value="statutes">Statutes</TabsTrigger>
                <TabsTrigger value="regulations">Regulations</TabsTrigger>
                <TabsTrigger value="secondary">Secondary Sources</TabsTrigger>
              </TabsList>

              <TabsContent value="cases" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Case Law Research
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Search through millions of court decisions and legal precedents
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Recent Cases</h3>
                        <p className="text-sm text-gray-600">Browse recently decided cases</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Landmark Decisions</h3>
                        <p className="text-sm text-gray-600">Explore influential court decisions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="statutes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Database className="h-5 w-5 mr-2" />
                      Statutory Research
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Access federal and state statutes with AI-powered analysis</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Federal Statutes</h3>
                        <p className="text-sm text-gray-600">U.S. Code and federal legislation</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">State Statutes</h3>
                        <p className="text-sm text-gray-600">State-specific laws and codes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="regulations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      Regulatory Research
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Navigate complex regulatory frameworks with AI assistance</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Federal Regulations</h3>
                        <p className="text-sm text-gray-600">CFR and agency regulations</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Industry Specific</h3>
                        <p className="text-sm text-gray-600">Sector-specific regulatory guidance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="secondary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Secondary Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Access legal treatises, law reviews, and expert commentary</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Law Reviews</h3>
                        <p className="text-sm text-gray-600">Academic legal scholarship</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Practice Guides</h3>
                        <p className="text-sm text-gray-600">Practical legal guidance</p>
                      </div>
                    </div>
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
