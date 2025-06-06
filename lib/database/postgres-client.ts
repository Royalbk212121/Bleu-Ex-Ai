/**
 * PostgreSQL Client
 * Handles connection and operations for structured data
 */
import { getSupabaseAdmin, hasAdminAccess } from "@/lib/supabase/server"
import { getSupabaseClient } from "@/lib/supabase/client"

/**
 * PostgreSQL client for structured data operations
 */
export class PostgresClient {
  /**
   * Execute a query with parameters (server-side only)
   */
  async query<T = any>(text: string, params: any[] = []): Promise<T[]> {
    const supabase = getSupabaseAdmin()

    try {
      // For simple queries without parameters, execute directly
      if (params.length === 0) {
        const { data, error } = await supabase.rpc("execute_sql", {
          query_text: text,
        })

        if (error) throw error
        return data as T[]
      }

      // For queries with parameters
      const { data, error } = await supabase.rpc("execute_sql", {
        query_text: text,
        query_params: JSON.stringify(params),
      })

      if (error) throw error
      return data as T[]
    } catch (error) {
      console.error("Database query error:", error)
      throw error
    }
  }

  /**
   * Execute a transaction with multiple queries (server-side only)
   */
  async transaction<T = any>(callback: (client: any) => Promise<T>): Promise<T> {
    const supabase = getSupabaseAdmin()

    try {
      // Begin transaction
      await this.query("BEGIN")

      // Execute callback
      const result = await callback(supabase)

      // Commit transaction
      await this.query("COMMIT")

      return result
    } catch (error) {
      // Rollback transaction on error
      try {
        await this.query("ROLLBACK")
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError)
      }
      console.error("Transaction error:", error)
      throw error
    }
  }

  /**
   * Get user by ID (server-side only)
   */
  async getUserById(userId: string) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) throw error
    return data
  }

  /**
   * Get user by email (server-side only)
   */
  async getUserByEmail(email: string) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error && error.code !== "PGRST116") throw error // PGRST116 is "no rows returned"
    return data
  }

  /**
   * Create user (server-side only)
   */
  async createUser(user: {
    email: string
    name: string
    role?: string
    subscription_tier?: string
  }) {
    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("users")
      .insert({
        email: user.email,
        name: user.name,
        role: user.role || "user",
        subscription_tier: user.subscription_tier || "free",
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Health check - can be used client or server side
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to use admin client if available (server-side)
      if (typeof window === "undefined" && hasAdminAccess()) {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase.rpc("database_health_check")

        if (error) {
          console.error("Admin health check failed:", error)
          return false
        }

        return data && data.length > 0 && data.every((row: any) => row.status === "healthy")
      }

      // Fallback to basic client check
      const client = getSupabaseClient()
      const { error } = await client.from("legal_documents").select("count", { count: "exact", head: true })
      return !error
    } catch (error) {
      console.error("PostgreSQL health check failed:", error)
      return false
    }
  }
}

// Singleton instance
export const postgresClient = new PostgresClient()
