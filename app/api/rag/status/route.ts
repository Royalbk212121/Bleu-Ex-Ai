import { NextResponse } from "next/server"
import { list } from "@vercel/blob"

export async function GET() {
  try {
    // Check RAG system status
    const { blobs } = await list({ prefix: "vectors/" })

    let totalDocuments = 0
    let totalChunks = 0
    const documentTypes = new Set()
    const jurisdictions = new Set()

    // Analyze stored vector data
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url)
        const vectorData = await response.json()

        totalDocuments++
        totalChunks += vectorData.chunks?.length || 0

        if (vectorData.metadata) {
          if (vectorData.metadata.area) documentTypes.add(vectorData.metadata.area)
          if (vectorData.metadata.jurisdiction) jurisdictions.add(vectorData.metadata.jurisdiction)
        }
      } catch (error) {
        console.error(`Error reading vector data from ${blob.url}:`, error)
      }
    }

    return NextResponse.json({
      status: "active",
      statistics: {
        totalDocuments,
        totalChunks,
        documentTypes: Array.from(documentTypes),
        jurisdictions: Array.from(jurisdictions),
        lastUpdated: new Date().toISOString(),
      },
      capabilities: {
        vectorSearch: true,
        semanticRetrieval: true,
        citationExtraction: true,
        legalAnalysis: true,
      },
    })
  } catch (error) {
    console.error("RAG status error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to retrieve RAG system status",
      },
      { status: 500 },
    )
  }
}
