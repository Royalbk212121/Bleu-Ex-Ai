"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Database, Download, ExternalLink } from "lucide-react"

interface SearchResult {
  source: string
  name: string
  results: any[]
  count: number
}

export function LegalSourceSearch() {
  const [query, setQuery] = useState("")
  const [jurisdiction, setJurisdiction] = useState("")
  const [sources, setSources] = useState(["google_scholar", "justia", "court_listener"])
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())

  const availableSources = [
    { id: "google_scholar", name: "Google Scholar", description: "Free case law and legal documents" },
    { id: "justia", name: "Justia", description: "Free legal information and case law" },
    { id: "court_listener", name: "CourtListener", description: "Free legal research database" },
    { id: "legal_database", name: "Internal Database", description: "Our curated legal database" },
  ]

  const jurisdictions = [
    { code: "US", name: "Federal" },
    { code: "CA", name: "California" },
    { code: "NY", name: "New York" },
    { code: "TX", name: "Texas" },
    { code: "FL", name: "Florida" },
  ]

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/legal-sources/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          sources,
          options: {
            jurisdiction,
            limit: 20,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.sources)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSourceToggle = (sourceId: string, checked: boolean) => {
    if (checked) {
      setSources([...sources, sourceId])
    } else {
      setSources(sources.filter((s) => s !== sourceId))
    }
  }

  const handleDocumentSelect = (documentId: string, checked: boolean) => {
    const newSelected = new Set(selectedDocuments)
    if (checked) {
      newSelected.add(documentId)
    } else {
      newSelected.delete(documentId)
    }
    setSelectedDocuments(newSelected)
  }

  const handleImportSelected = async () => {
    if (selectedDocuments.size === 0) return

    const documentsToImport = []
    results.forEach((sourceResult) => {
      sourceResult.results.forEach((doc) => {
        const docId = `${sourceResult.source}-${doc.title}`
        if (selectedDocuments.has(docId)) {
          documentsToImport.push({
            source: sourceResult.source,
            document: doc,
          })
        }
      })
    })

    // Group by source and import
    const groupedBySource = documentsToImport.reduce(
      (acc, item) => {
        if (!acc[item.source]) acc[item.source] = []
        acc[item.source].push(item.document)
        return acc
      },
      {} as Record<string, any[]>,
    )

    for (const [source, documents] of Object.entries(groupedBySource)) {
      try {
        const response = await fetch("/api/legal-sources/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, documents }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`Imported ${result.imported} documents from ${source}`)
        }
      } catch (error) {
        console.error(`Import error for ${source}:`, error)
      }
    }

    setSelectedDocuments(new Set())
    alert("Documents imported successfully!")
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Legal Sources Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search legal cases, statutes, or documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Select value={jurisdiction} onValueChange={setJurisdiction}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jurisdictions</SelectItem>
                {jurisdictions.map((j) => (
                  <SelectItem key={j.code} value={j.code}>
                    {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Source Selection */}
          <div>
            <h4 className="font-medium mb-2">Search Sources</h4>
            <div className="grid grid-cols-2 gap-3">
              {availableSources.map((source) => (
                <div key={source.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={source.id}
                    checked={sources.includes(source.id)}
                    onCheckedChange={(checked) => handleSourceToggle(source.id, checked as boolean)}
                  />
                  <label htmlFor={source.id} className="text-sm">
                    <div className="font-medium">{source.name}</div>
                    <div className="text-gray-500 text-xs">{source.description}</div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Search Results</h3>
            {selectedDocuments.size > 0 && (
              <Button onClick={handleImportSelected}>
                <Download className="h-4 w-4 mr-2" />
                Import Selected ({selectedDocuments.size})
              </Button>
            )}
          </div>

          {results.map((sourceResult) => (
            <Card key={sourceResult.source}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>{sourceResult.name}</span>
                    <Badge variant="secondary">{sourceResult.count} results</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sourceResult.results.map((doc, index) => {
                    const docId = `${sourceResult.source}-${doc.title}`
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <Checkbox
                              checked={selectedDocuments.has(docId)}
                              onCheckedChange={(checked) => handleDocumentSelect(docId, checked as boolean)}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{doc.title}</h4>
                              {doc.citation && <p className="text-sm text-gray-600">{doc.citation}</p>}
                              {doc.court && <p className="text-sm text-gray-600">{doc.court}</p>}
                              {doc.snippet && <p className="text-sm mt-2">{doc.snippet}</p>}
                              <div className="flex items-center space-x-2 mt-2">
                                {doc.jurisdiction && <Badge variant="outline">{doc.jurisdiction}</Badge>}
                                {doc.date && <Badge variant="outline">{doc.date}</Badge>}
                              </div>
                            </div>
                          </div>
                          {doc.url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
