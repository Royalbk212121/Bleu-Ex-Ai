import { NextResponse } from "next/server"
import { mlModelsService } from "@/lib/ai/ml-models"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { documentId, content, metadata, batch = false } = body

    if (batch && Array.isArray(body.documents)) {
      // Handle batch classification
      const results = await mlModelsService.batchClassifyDocuments(body.documents)

      return NextResponse.json({
        success: true,
        results,
        totalProcessed: results.length,
      })
    } else {
      // Handle single document classification
      if (!documentId || !content) {
        return NextResponse.json({ error: "Document ID and content are required" }, { status: 400 })
      }

      const result = await mlModelsService.classifyDocument({
        documentId,
        content,
        metadata,
      })

      return NextResponse.json({
        success: true,
        result,
      })
    }
  } catch (error) {
    console.error("Classification API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
