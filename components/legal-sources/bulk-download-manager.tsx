"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Database, RefreshCw, CheckCircle, AlertCircle, BarChart3 } from "lucide-react"

export function BulkDownloadManager() {
  const [queries, setQueries] = useState("constitutional law\ncriminal procedure\ncontract law\ntort law")
  const [downloading, setDownloading] = useState(false)
  const [downloadResults, setDownloadResults] = useState<any>(null)
  const [curationAnalysis, setCurationAnalysis] = useState<any>(null)
  const [curating, setCurating] = useState(false)

  const startBulkDownload = async () => {
    setDownloading(true)
    try {
      const queryList = queries.split("\n").filter((q) => q.trim())

      const response = await fetch("/api/legal-sources/bulk-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sources: ["google_scholar", "justia", "court_listener"],
          queries: queryList,
          options: { limit: 5 },
        }),
      })

      if (response.ok) {
        const results = await response.json()
        setDownloadResults(results)
      }
    } catch (error) {
      console.error("Bulk download error:", error)
    } finally {
      setDownloading(false)
    }
  }

  const analyzeCuration = async () => {
    try {
      const response = await fetch("/api/legal-sources/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze" }),
      })

      if (response.ok) {
        const analysis = await response.json()
        setCurationAnalysis(analysis)
      }
    } catch (error) {
      console.error("Curation analysis error:", error)
    }
  }

  const performCuration = async () => {
    setCurating(true)
    try {
      const response = await fetch("/api/legal-sources/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "curate" }),
      })

      if (response.ok) {
        const results = await response.json()
        alert(
          `Curation completed! Removed ${results.results.duplicatesRemoved} duplicates, enhanced ${results.results.metadataEnhanced} documents.`,
        )
        // Refresh analysis
        await analyzeCuration()
      }
    } catch (error) {
      console.error("Curation error:", error)
    } finally {
      setCurating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="download">
        <TabsList>
          <TabsTrigger value="download">
            <Download className="h-4 w-4 mr-2" />
            Bulk Download
          </TabsTrigger>
          <TabsTrigger value="curation">
            <Database className="h-4 w-4 mr-2" />
            Database Curation
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="download" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Download from Legal Sources</CardTitle>
              <p className="text-sm text-muted-foreground">
                Download legal documents from Google Scholar, Justia, and CourtListener
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Queries (one per line)</label>
                <Textarea
                  placeholder="Enter search queries, one per line..."
                  value={queries}
                  onChange={(e) => setQueries(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex items-center space-x-4">
                <Button onClick={startBulkDownload} disabled={downloading}>
                  {downloading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Start Bulk Download
                    </>
                  )}
                </Button>

                <div className="text-sm text-muted-foreground">Sources: Google Scholar, Justia, CourtListener</div>
              </div>

              {downloading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Downloading legal documents...</span>
                    <span>Processing queries</span>
                  </div>
                  <Progress value={33} />
                </div>
              )}

              {downloadResults && (
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Download Complete</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Total Downloaded</div>
                        <div className="text-2xl font-bold text-green-600">
                          {downloadResults.results.summary.totalDownloaded}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Failed</div>
                        <div className="text-2xl font-bold text-red-600">
                          {downloadResults.results.summary.totalFailed}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Google Scholar</div>
                        <div className="text-lg font-bold">{downloadResults.results.google_scholar.length}</div>
                      </div>
                      <div>
                        <div className="font-medium">Processing Time</div>
                        <div className="text-lg font-bold">
                          {(downloadResults.results.summary.processingTime / 1000).toFixed(1)}s
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curation" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Curation</CardTitle>
                <p className="text-sm text-muted-foreground">Analyze and curate your legal document database</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Button onClick={analyzeCuration}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analyze Database
                  </Button>

                  {curationAnalysis && (
                    <Button onClick={performCuration} disabled={curating}>
                      {curating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Curating...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4 mr-2" />
                          Perform Curation
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {curationAnalysis && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <div className="text-sm font-medium">Total Documents</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {curationAnalysis.summary.totalDocuments}
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <div className="text-sm font-medium">Sources</div>
                        <div className="text-2xl font-bold text-green-600">{curationAnalysis.summary.totalSources}</div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                        <div className="text-sm font-medium">Duplicates</div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {curationAnalysis.summary.duplicateGroups}
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                        <div className="text-sm font-medium">Jurisdictions</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {curationAnalysis.summary.totalJurisdictions}
                        </div>
                      </div>
                    </div>

                    {curationAnalysis.recommendations.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Curation Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {curationAnalysis.recommendations.map((rec: any, index: number) => (
                              <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                                <AlertCircle
                                  className={`h-5 w-5 mt-0.5 ${
                                    rec.priority === "high"
                                      ? "text-red-500"
                                      : rec.priority === "medium"
                                        ? "text-yellow-500"
                                        : "text-blue-500"
                                  }`}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Badge variant={rec.priority === "high" ? "destructive" : "secondary"}>
                                      {rec.priority} priority
                                    </Badge>
                                    <Badge variant="outline">{rec.type}</Badge>
                                  </div>
                                  <p className="text-sm font-medium">{rec.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{rec.action}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {curationAnalysis ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Source Distribution</h3>
                    <div className="space-y-2">
                      {curationAnalysis.sourceDistribution.map((source: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="font-medium">{source.source}</span>
                          <Badge variant="outline">{source.document_count} documents</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Top Jurisdictions</h3>
                    <div className="space-y-2">
                      {curationAnalysis.jurisdictionDistribution.slice(0, 5).map((jurisdiction: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="font-medium">{jurisdiction.jurisdiction}</span>
                          <Badge variant="outline">{jurisdiction.document_count} documents</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">Run database analysis to see analytics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
