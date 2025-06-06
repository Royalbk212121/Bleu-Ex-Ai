"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, Upload } from "lucide-react"

export function DataIngestionPanel() {
  const [activeTab, setActiveTab] = useState("url")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // URL ingestion state
  const [url, setUrl] = useState("")
  const [urlDocType, setUrlDocType] = useState("CASE")
  const [urlJurisdiction, setUrlJurisdiction] = useState("")

  // S3 ingestion state
  const [bucket, setBucket] = useState("")
  const [key, setKey] = useState("")
  const [s3DocType, setS3DocType] = useState("CASE")
  const [s3Jurisdiction, setS3Jurisdiction] = useState("")

  const handleUrlIngest = async () => {
    if (!url) {
      setError("URL is required")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/data-pipeline/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "url",
          url,
          metadata: {
            documentType: urlDocType,
            jurisdiction: urlJurisdiction || undefined,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to ingest document")
      }

      setSuccess(`Document ingested successfully with ID: ${data.documentId}`)
      setUrl("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleS3Ingest = async () => {
    if (!bucket || !key) {
      setError("Bucket and key are required")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/data-pipeline/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "s3",
          bucket,
          key,
          metadata: {
            documentType: s3DocType,
            jurisdiction: s3Jurisdiction || undefined,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to ingest document")
      }

      setSuccess(`Document ingested successfully with ID: ${data.documentId}`)
      setBucket("")
      setKey("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Legal Data Ingestion
        </CardTitle>
        <CardDescription>Ingest legal documents from various sources</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">URL Source</TabsTrigger>
            <TabsTrigger value="s3">S3 Bucket</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="url">Document URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/legal-document.pdf"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="urlDocType">Document Type</Label>
                <Select value={urlDocType} onValueChange={setUrlDocType}>
                  <SelectTrigger id="urlDocType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASE">Case Law</SelectItem>
                    <SelectItem value="STATUTE">Statute</SelectItem>
                    <SelectItem value="REGULATION">Regulation</SelectItem>
                    <SelectItem value="GUIDE">Legal Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urlJurisdiction">Jurisdiction (Optional)</Label>
                <Select value={urlJurisdiction} onValueChange={setUrlJurisdiction}>
                  <SelectTrigger id="urlJurisdiction">
                    <SelectValue placeholder="Select jurisdiction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="US-FED">US Federal</SelectItem>
                    <SelectItem value="US-CA">California</SelectItem>
                    <SelectItem value="US-NY">New York</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleUrlIngest} disabled={loading || !url} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingesting...
                </>
              ) : (
                "Ingest Document"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="s3" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="bucket">S3 Bucket</Label>
              <Input
                id="bucket"
                placeholder="my-legal-documents"
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">S3 Key</Label>
              <Input
                id="key"
                placeholder="legal-data/us-fed/cases/2023/smith-v-jones.pdf"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="s3DocType">Document Type</Label>
                <Select value={s3DocType} onValueChange={setS3DocType}>
                  <SelectTrigger id="s3DocType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASE">Case Law</SelectItem>
                    <SelectItem value="STATUTE">Statute</SelectItem>
                    <SelectItem value="REGULATION">Regulation</SelectItem>
                    <SelectItem value="GUIDE">Legal Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="s3Jurisdiction">Jurisdiction (Optional)</Label>
                <Select value={s3Jurisdiction} onValueChange={setS3Jurisdiction}>
                  <SelectTrigger id="s3Jurisdiction">
                    <SelectValue placeholder="Select jurisdiction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="US-FED">US Federal</SelectItem>
                    <SelectItem value="US-CA">California</SelectItem>
                    <SelectItem value="US-NY">New York</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleS3Ingest} disabled={loading || !bucket || !key} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingesting...
                </>
              ) : (
                "Ingest Document"
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="mt-4 border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Success</AlertTitle>
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="text-sm text-gray-500">Supported formats: PDF, DOCX, TXT</CardFooter>
    </Card>
  )
}
