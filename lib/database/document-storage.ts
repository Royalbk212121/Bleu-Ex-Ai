/**
 * Document Storage Client
 * Handles document content storage using Supabase
 */
import { getSupabaseAdmin } from "@/lib/supabase/client"

// Document interfaces
export interface DocumentContent {
  id?: string
  documentId: string
  content: string
  editorState?: any
  version: number
  createdAt: Date
  updatedBy: string
}

export interface DocumentVersion {
  id?: string
  documentId: string
  version: number
  content: string
  editorState?: any
  changes: string
  createdAt: Date
  createdBy: string
}

/**
 * Document Storage client for document content operations
 */
export class DocumentStorageClient {
  private initialized = false

  /**
   * Initialize document storage
   */
  async initialize(): Promise<void> {
    if (!this.initialized) {
      try {
        const supabase = getSupabaseAdmin()

        // Check if tables exist, create them if they don't
        const { error: contentError } = await supabase.rpc("create_documents_content_if_not_exists")
        const { error: versionsError } = await supabase.rpc("create_document_versions_if_not_exists")

        if (contentError || versionsError) {
          console.log("Tables may not exist, creating manually")
          await this.createTables()
        }

        this.initialized = true
        console.log("Document storage initialized")
      } catch (error) {
        console.error("Document storage initialization error:", error)
        throw error
      }
    }
  }

  /**
   * Create necessary tables if they don't exist
   */
  private async createTables(): Promise<void> {
    const supabase = getSupabaseAdmin()

    // Create documents_content table
    const { error: contentTableError } = await supabase.rpc("execute_sql", {
      query_text: `
        CREATE TABLE IF NOT EXISTS documents_content (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          document_id TEXT NOT NULL UNIQUE,
          content TEXT NOT NULL,
          editor_state JSONB,
          version INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_by TEXT NOT NULL
        )
      `,
      query_params: [],
    })

    if (contentTableError) {
      console.error("Error creating documents_content table:", contentTableError)
    }

    // Create document_versions table
    const { error: versionsTableError } = await supabase.rpc("execute_sql", {
      query_text: `
        CREATE TABLE IF NOT EXISTS document_versions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          document_id TEXT NOT NULL,
          version INTEGER NOT NULL,
          content TEXT NOT NULL,
          editor_state JSONB,
          changes TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by TEXT NOT NULL
        )
      `,
      query_params: [],
    })

    if (versionsTableError) {
      console.error("Error creating document_versions table:", versionsTableError)
    }
  }

  /**
   * Get document content
   */
  async getDocumentContent(documentId: string): Promise<DocumentContent | null> {
    await this.ensureInitialized()
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.from("documents_content").select("*").eq("document_id", documentId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null
      }
      console.error("Error fetching document content:", error)
      throw error
    }

    return data ? this.mapToDocumentContent(data) : null
  }

  /**
   * Create or update document content
   */
  async saveDocumentContent(
    documentId: string,
    content: string,
    editorState: any | null,
    version: number,
    userId: string,
  ): Promise<string> {
    await this.ensureInitialized()
    const supabase = getSupabaseAdmin()

    const now = new Date()
    const documentContent = {
      document_id: documentId,
      content,
      editor_state: editorState || null,
      version,
      created_at: now.toISOString(),
      updated_by: userId,
    }

    const { data, error } = await supabase.from("documents_content").upsert(documentContent).select("id").single()

    if (error) {
      console.error("Error saving document content:", error)
      throw error
    }

    return data?.id || documentId
  }

  /**
   * Create document version
   */
  async createDocumentVersion(
    documentId: string,
    version: number,
    content: string,
    editorState: any | null,
    changes: string,
    userId: string,
  ): Promise<string> {
    await this.ensureInitialized()
    const supabase = getSupabaseAdmin()

    const documentVersion = {
      document_id: documentId,
      version,
      content,
      editor_state: editorState || null,
      changes,
      created_at: new Date().toISOString(),
      created_by: userId,
    }

    const { data, error } = await supabase.from("document_versions").insert(documentVersion).select("id").single()

    if (error) {
      console.error("Error creating document version:", error)
      throw error
    }

    return data?.id || ""
  }

  /**
   * Get document versions
   */
  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    await this.ensureInitialized()
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version", { ascending: false })

    if (error) {
      console.error("Error fetching document versions:", error)
      throw error
    }

    return data ? data.map(this.mapToDocumentVersion) : []
  }

  /**
   * Get specific document version
   */
  async getDocumentVersion(documentId: string, version: number): Promise<DocumentVersion | null> {
    await this.ensureInitialized()
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .eq("version", version)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null
      }
      console.error("Error fetching document version:", error)
      throw error
    }

    return data ? this.mapToDocumentVersion(data) : null
  }

  /**
   * Delete document content and versions
   */
  async deleteDocument(documentId: string): Promise<void> {
    await this.ensureInitialized()
    const supabase = getSupabaseAdmin()

    // Delete document content
    const { error: contentError } = await supabase.from("documents_content").delete().eq("document_id", documentId)

    if (contentError) {
      console.error("Error deleting document content:", contentError)
      throw contentError
    }

    // Delete document versions
    const { error: versionsError } = await supabase.from("document_versions").delete().eq("document_id", documentId)

    if (versionsError) {
      console.error("Error deleting document versions:", versionsError)
      throw versionsError
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("documents_content").select("id").limit(1)
      return !error
    } catch (error) {
      console.error("Document storage health check failed:", error)
      return false
    }
  }

  /**
   * Ensure connection is established
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  /**
   * Map database record to DocumentContent
   */
  private mapToDocumentContent(record: any): DocumentContent {
    return {
      id: record.id,
      documentId: record.document_id,
      content: record.content,
      editorState: record.editor_state,
      version: record.version,
      createdAt: new Date(record.created_at),
      updatedBy: record.updated_by,
    }
  }

  /**
   * Map database record to DocumentVersion
   */
  private mapToDocumentVersion(record: any): DocumentVersion {
    return {
      id: record.id,
      documentId: record.document_id,
      version: record.version,
      content: record.content,
      editorState: record.editor_state,
      changes: record.changes,
      createdAt: new Date(record.created_at),
      createdBy: record.created_by,
    }
  }
}

// Singleton instance
export const documentStorageClient = new DocumentStorageClient()
