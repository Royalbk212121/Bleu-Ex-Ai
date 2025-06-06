import { NextResponse } from "next/server"
import { enhancedRAGService } from "@/lib/ai/enhanced-rag-service"
import { veritasShield } from "@/lib/ai/veritas-shield"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      query,
      content,
      sources = [],
      options = {},
      validationType = "rag", // 'rag' or 'content'
    } = body

    if (!query && !content) {
      return NextResponse.json({ error: "Either query or content is required" }, { status: 400 })
    }

    let result

    if (validationType === "rag" && query) {
      // Full RAG with VeritasShield validation
      result = await enhancedRAGService.processGroundedQuery({
        query,
        options: {
          confidenceThreshold: 75,
          requireValidation: true,
          enableHITL: true,
          strictMode: false,
          ...options,
        },
      })
    } else if (content) {
      // Direct content validation
      const validation = await veritasShield.validateContent(content, sources)
      result = {
        validation,
        confidenceScore: validation.confidenceScore.overall,
        requiresHumanReview: validation.requiresHumanReview,
        blockchainHash: validation.blockchainHash,
      }
    } else {
      return NextResponse.json({ error: "Invalid validation type or missing parameters" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error("VeritasShield validation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Validation failed",
      },
      { status: 500 },
    )
  }
}
