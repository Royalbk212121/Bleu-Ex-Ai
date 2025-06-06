import { NextResponse } from "next/server"
import { getSupabaseAdmin, hasAdminAccess } from "@/lib/supabase/server"
import { getDatabaseStatus } from "@/lib/supabase/client"

export async function GET() {
  try {
    // Get basic database status
    const status = await getDatabaseStatus()

    // If we don't have admin access, return limited status
    if (!hasAdminAccess()) {
      return NextResponse.json({
        status: status.status === "connected" ? "limited" : "error",
        timestamp: new Date().toISOString(),
        message: "Limited access - configure SUPABASE_SERVICE_ROLE_KEY for full functionality",
        services: {
          supabase: {
            status: status.status === "connected" ? "healthy" : "unhealthy",
            type: "database",
            purpose: "Primary database storage",
            hasAdminAccess: false,
          },
        },
        tables: status.counts,
      })
    }

    // Full health check with admin access
    const client = getSupabaseAdmin()

    // Check basic connectivity
    const { error: connectError } = await client.from("legal_documents").select("count", { count: "exact", head: true })
    const isHealthy = !connectError

    return NextResponse.json({
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        supabase: {
          status: isHealthy ? "healthy" : "unhealthy",
          type: "database",
          purpose: "Primary database storage",
          hasAdminAccess: true,
        },
      },
      tables: status.counts,
    })
  } catch (error) {
    console.error("Database health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        hasAdminAccess: hasAdminAccess(),
      },
      { status: 500 },
    )
  }
}
