import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    let connected = false
    let tablesExist = false
    let documentCount = 0
    let error = null

    // Test basic connection
    try {
      const { data, error: connectionError } = await supabaseAdmin.from("legal_documents").select("count", {
        count: "exact",
        head: true,
      })

      if (!connectionError) {
        connected = true
        tablesExist = true
        documentCount = data?.length || 0
      } else {
        connected = true // Connection works, but table might not exist
        error = connectionError.message
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Connection failed"
    }

    // If legal_documents doesn't exist, check if we can at least connect
    if (!tablesExist) {
      try {
        // Try a simple query that should work even without our tables
        const { error: simpleError } = await supabaseAdmin.rpc("now")
        if (!simpleError) {
          connected = true
        }
      } catch (err) {
        connected = false
        error = "Cannot connect to database"
      }
    }

    return NextResponse.json({
      connected,
      tablesExist,
      documentCount,
      error,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        tablesExist: false,
        documentCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
