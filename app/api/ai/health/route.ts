import { NextResponse } from "next/server"
import { llmService } from "@/lib/ai/llm-service"
import { embeddingService } from "@/lib/ai/embedding-service"
import { ragService } from "@/lib/ai/rag-service"
import { mlModelsService } from "@/lib/ai/ml-models"

export async function GET() {
  try {
    const [llmHealth, embeddingHealth, ragHealth, mlHealth] = await Promise.all([
      llmService.healthCheck(),
      embeddingService.healthCheck(),
      ragService.healthCheck(),
      mlModelsService.healthCheck(),
    ])

    const overallHealth = {
      llm: llmHealth,
      embedding: embeddingHealth,
      rag: ragHealth,
      ml: mlHealth,
      timestamp: new Date().toISOString(),
    }

    // Calculate overall status
    const allHealthy =
      Object.values(llmHealth).some(Boolean) &&
      Object.values(embeddingHealth).some(Boolean) &&
      ragHealth &&
      Object.values(mlHealth).some(Boolean)

    return NextResponse.json({
      status: allHealthy ? "healthy" : "degraded",
      services: overallHealth,
      usage: llmService.getUsageStats(),
      cache: embeddingService.getCacheStats(),
      classification: mlModelsService.getClassificationStats(),
    })
  } catch (error) {
    console.error("AI health check error:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
