import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Server-side client with service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Database utility functions
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const { data, error } = await supabase.rpc("execute_sql", {
      query_text: query,
      query_params: params,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Test database connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.from("legal_documents").select("count", { count: "exact", head: true })

    if (error) throw error
    return { success: true, connected: true }
  } catch (error) {
    console.error("Connection test failed:", error)
    return { success: false, connected: false, error }
  }
}

// Get database status
export async function getDatabaseStatus() {
  try {
    const tables = ["legal_documents", "legal_cases", "jurisdictions", "practice_areas", "document_types"]
    const counts: Record<string, number> = {}

    for (const table of tables) {
      try {
        const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true })

        if (!error) {
          counts[table] = count || 0
        }
      } catch (error) {
        counts[table] = 0
      }
    }

    return {
      status: "connected",
      tables,
      counts,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: "error",
      tables: [],
      counts: {},
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Re-export everything from the client module for backward compatibility
export * from "./supabase/client"
