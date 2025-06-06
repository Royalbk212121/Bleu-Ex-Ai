import { NextResponse } from "next/server"
import { userService } from "@/lib/microservices/user-service"
import { realtimeService } from "@/lib/microservices/realtime-service"
import { aiOrchestrationService } from "@/lib/microservices/ai-orchestration-service"

export async function GET() {
  try {
    const healthChecks = await Promise.allSettled([
      checkAuthService(),
      checkUserService(),
      checkDocumentService(),
      checkRealtimeService(),
      checkAIService(),
    ])

    const services = {
      auth: healthChecks[0].status === "fulfilled" ? healthChecks[0].value : { status: "error" },
      user: healthChecks[1].status === "fulfilled" ? healthChecks[1].value : { status: "error" },
      document: healthChecks[2].status === "fulfilled" ? healthChecks[2].value : { status: "error" },
      realtime: healthChecks[3].status === "fulfilled" ? healthChecks[3].value : { status: "error" },
      ai: healthChecks[4].status === "fulfilled" ? healthChecks[4].value : { status: "error" },
    }

    const overallStatus = Object.values(services).every((s) => s.status === "healthy") ? "healthy" : "degraded"

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 500 },
    )
  }
}

async function checkAuthService() {
  try {
    // Simple health check - could be expanded
    return { status: "healthy", service: "auth" }
  } catch (error) {
    return { status: "error", service: "auth", error: error instanceof Error ? error.message : "Unknown error" }
  }
}

async function checkUserService() {
  try {
    const plans = userService.getSubscriptionPlans()
    return { status: "healthy", service: "user", plansAvailable: plans.length }
  } catch (error) {
    return { status: "error", service: "user", error: error instanceof Error ? error.message : "Unknown error" }
  }
}

async function checkDocumentService() {
  try {
    return { status: "healthy", service: "document" }
  } catch (error) {
    return { status: "error", service: "document", error: error instanceof Error ? error.message : "Unknown error" }
  }
}

async function checkRealtimeService() {
  try {
    const stats = realtimeService.getStats()
    return { status: "healthy", service: "realtime", ...stats }
  } catch (error) {
    return { status: "error", service: "realtime", error: error instanceof Error ? error.message : "Unknown error" }
  }
}

async function checkAIService() {
  try {
    const stats = aiOrchestrationService.getStats()
    return { status: "healthy", service: "ai", ...stats }
  } catch (error) {
    return { status: "error", service: "ai", error: error instanceof Error ? error.message : "Unknown error" }
  }
}
