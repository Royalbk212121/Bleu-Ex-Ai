import { NextResponse } from "next/server"
import { getSupabaseAdmin, hasAdminAccess } from "@/lib/supabase/server"

export async function POST() {
  try {
    // Check if we have admin access
    if (!hasAdminAccess()) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin access required. Please configure SUPABASE_SERVICE_ROLE_KEY environment variable.",
        },
        { status: 403 },
      )
    }

    const supabase = getSupabaseAdmin()

    // Run cleanup function
    const { data: cleanupData, error: cleanupError } = await supabase.rpc("cleanup_old_data")

    if (cleanupError) {
      console.error("Error running cleanup:", cleanupError)
      return NextResponse.json({ success: false, error: cleanupError.message }, { status: 500 })
    }

    // Run vacuum function
    const { data: vacuumData, error: vacuumError } = await supabase.rpc("vacuum_database")

    if (vacuumError) {
      console.error("Error running vacuum:", vacuumError)
      return NextResponse.json({ success: false, error: vacuumError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cleanup: cleanupData?.[0] || {},
      vacuum: vacuumData?.[0] || {},
    })
  } catch (error) {
    console.error("Database optimization error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
