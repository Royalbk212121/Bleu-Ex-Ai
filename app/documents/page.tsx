"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Filter, Upload, Eye, Download, Share, MoreHorizontal } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { DocumentUpload } from "@/components/document-upload"
import Link from "next/link"

interface Document {
  id: string
  name: string
  type: string
  status: string
  size: number
  date: string
  risk: string
  issues: number
  url?: string
}

export default function DocumentLibrary() {
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      name: "Employment Contract - John Doe",
      type: "contract",
      status: "review",
      size: 2.4 * 1024 * 1024,
      date: "2024-01-15",
      risk: "medium",
      issues: 3,
    },
    {
      id: "2",
      name: "Legal Brief - Patent Dispute",
      type: "brief",
      status: "final",
      size: 1.8 * 1024 * 1024,
      date: "2024-01-14",
      risk: "low",
      issues: 0,
    },
    {
      id: "3",
      name: "Discovery Documents - Case #456",
      type: "discovery",
      status: "draft",
      size: 15.2 * 1024 * 1024,
      date: "2024-01-13",
      risk: "high",
      issues: 7,
    },
  ])
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Fetch documents from API
    async function fetchDocuments() {
      try {
        const response = await fetch("/api/documents")
        if (response.ok) {
          const data = await response.json()
          if (data.documents && data.documents.length > 0) {
            setDocuments((prev) => [...prev, ...data.documents])
          }
        }
      } catch (error) {
        console.error("Error fetching documents:", error)
      }
    }

    fetchDocuments()
  }, [])

  const filteredDocuments = documents.filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Document Library" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">Document Library</h1>
                <p className="text-gray-600">Manage and analyze your legal documents</p>
              </div>
              <Button className="bg-black hover:bg-gray-800" onClick={() => setShowUploadModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
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

            {/* Upload Modal */}
            {showUploadModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Upload Documents</h2>
                    <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)}>
                      &times;
                    </Button>
                  </div>
                  <DocumentUpload />
                  <div className="flex justify-end mt-6">
                    <Button variant="outline" className="mr-2" onClick={() => setShowUploadModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowUploadModal(false)}>Done</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Documents List */}
            <div className="space-y-4">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <Link href={`/documents/${doc.id}`} key={doc.id}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{doc.name}</h3>
                              <div className="flex items-center space-x-3 mt-1">
                                <Badge variant="outline">{doc.type}</Badge>
                                <Badge
                                  variant="secondary"
                                  className={
                                    doc.status === "final" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                                  }
                                >
                                  {doc.status}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.date}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <Badge className={getRiskColor(doc.risk)}>{doc.risk} risk</Badge>
                              {doc.issues > 0 && (
                                <p className="text-sm text-gray-600 mt-1">{doc.issues} issues found</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Share className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-medium mb-2">No documents found</h2>
                  <p className="text-gray-600 mb-6">Upload your first document to get started</p>
                  <Button onClick={() => setShowUploadModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
