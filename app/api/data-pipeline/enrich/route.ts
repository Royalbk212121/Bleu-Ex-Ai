import { NextResponse } from "next/server"
import { dataEnrichmentService } from "@/lib/data-pipeline/data-enrichment"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { documentId } = body

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    const result = await dataEnrichmentService.enrichDocument(documentId)

    return NextResponse.json({
      success: true,
      documentId,
      summary: result.summary,
      keyTerms: result.keyTerms,
      citations: result.citations,
      message: "Document enriched successfully",
    })
  } catch (error) {
    console.error("Data enrichment error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
