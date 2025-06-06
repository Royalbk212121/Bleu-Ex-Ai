import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  )
}

// Client-side singleton
let supabaseClient: SupabaseClient<Database> | null = null

/**
 * Get the public Supabase client (client-side safe)
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return supabaseClient
}

// Legacy export for backward compatibility
export const supabase = getSupabaseClient()

// Test database connection (client-side safe)
export async function testConnection() {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client.from("legal_documents").select("count", { count: "exact", head: true })

    if (error) throw error
    return { success: true, connected: true }
  } catch (error) {
    console.error("Connection test failed:", error)
    return { success: false, connected: false, error }
  }
}

// Get database status (client-side safe)
export async function getDatabaseStatus() {
  try {
    const client = getSupabaseClient()
    const tables = ["legal_documents", "legal_cases", "jurisdictions", "practice_areas", "document_types"]
    const counts: Record<string, number> = {}

    for (const table of tables) {
      try {
        const { count, error } = await client.from(table).select("*", { count: "exact", head: true })

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
