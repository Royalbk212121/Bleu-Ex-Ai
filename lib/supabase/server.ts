import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  )
}

// Server-side singleton for admin operations
let supabaseAdminClient: SupabaseClient<Database> | null = null

/**
 * Get the admin Supabase client (server-side only)
 * Only use this in API routes, server actions, or server components
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!supabaseServiceKey) {
    console.warn("Supabase service role key not available - admin operations will be limited")
    // Return regular client as fallback for server-side operations
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseAdminClient
}

/**
 * Check if admin client is available (server-side only)
 */
export function hasAdminAccess(): boolean {
  return !!supabaseServiceKey
}

/**
 * Create a server-side client for server components
 */
export function createServerClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Database utility functions (server-side only)
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const client = getSupabaseAdmin()

    // Check if we have admin access for this operation
    if (!hasAdminAccess()) {
      throw new Error("Admin access required for this operation")
    }

    const { data, error } = await client.rpc("execute_sql", {
      query_text: query,
      query_params: JSON.stringify(params),
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}
