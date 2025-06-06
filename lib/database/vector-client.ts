/**
 * Vector Database Client
 * Handles vector embeddings storage and retrieval using Supabase pgvector
 */
import { getSupabaseAdmin } from "@/lib/supabase/client"
import { generateEmbedding } from "@/lib/embeddings"

interface VectorMetadata {
  text: string
  source: string
  documentId?: string
  citation?: string
  jurisdiction?: string
  practiceArea?: string
  documentType?: string
  date?: string
  section?: string
  pageNumber?: number
  chunkIndex?: number
  citations?: string[]
  [key: string]: any
}

interface SearchResult {
  id: string
  score: number
  metadata: VectorMetadata
}

/**
 * Vector database client for embeddings operations using Supabase pgvector
 */
export class VectorClient {
  private initialized = false

  /**
   * Initialize the vector client
   */
  async initialize(): Promise<void> {
    if (!this.initialized) {
      try {
        const supabase = getSupabaseAdmin()

        // Check if pgvector extension is installed
        const { data, error } = await supabase.from("pg_extension").select("extname").eq("extname", "vector").single()

        if (error && error.code === "PGRST116") {
          console.log("pgvector extension not found, attempting to create...")
          await this.setupPgVector()
        }

        this.initialized = true
        console.log("Vector client initialized")
      } catch (error) {
        console.error("Vector client initialization error:", error)
        // Don't throw error, just log it and continue
        this.initialized = true
      }
    }
  }

  /**
   * Set up pgvector extension and tables
   */
  private async setupPgVector(): Promise<void> {
    const supabase = getSupabaseAdmin()

    try {
      // Create pgvector extension
      await supabase.rpc("execute_sql", {
        query_text: "CREATE EXTENSION IF NOT EXISTS vector",
      })

      // Create embeddings table if it doesn't exist
      await supabase.rpc("execute_sql", {
        query_text: `
          CREATE TABLE IF NOT EXISTS document_embeddings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            document_id TEXT NOT NULL,
            chunk_index INTEGER NOT NULL DEFAULT 0,
            chunk_text TEXT NOT NULL,
            embedding VECTOR(1536),
            section_title TEXT,
            citations TEXT[],
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
      })

      // Create index for faster similarity search
      await supabase.rpc("execute_sql", {
        query_text: `
          CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx 
          ON document_embeddings USING ivfflat (embedding vector_cosine_ops) 
          WITH (lists = 100)
        `,
      })

      // Create index on document_id for faster filtering
      await supabase.rpc("execute_sql", {
        query_text: `
          CREATE INDEX IF NOT EXISTS document_embeddings_document_id_idx 
          ON document_embeddings(document_id)
        `,
      })

      console.log("pgvector setup completed")
    } catch (error) {
      console.error("pgvector setup error:", error)
      // Don't throw error, just log it
    }
  }

  /**
   * Store vector embeddings
   */
  async storeEmbeddings(
    vectors: Array<{
      id: string
      values: number[]
      metadata: VectorMetadata
    }>,
  ): Promise<void> {
    await this.ensureInitialized()
    const supabase = getSupabaseAdmin()

    // Process vectors in batches
    const batchSize = 100
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize)

      // Prepare batch for insertion
      const embeddings = batch.map((vector) => ({
        id: vector.id,
        document_id: vector.metadata.documentId || "",
        chunk_index: vector.metadata.chunkIndex || 0,
        chunk_text: vector.metadata.text,
        embedding: `[${vector.values.join(",")}]`,
        section_title: vector.metadata.section || null,
        citations: vector.metadata.citations || null,
        metadata: vector.metadata,
      }))

      // Insert batch
      const { error } = await supabase.from("document_embeddings").insert(embeddings)

      if (error) {
        console.error("Error storing embeddings batch:", error)
        throw error
      }
    }
  }

  /**
   * Store text chunks with auto-generated embeddings
   */
  async storeTextChunks(
    chunks: Array<{
      id: string
      text: string
      metadata: Omit<VectorMetadata, "text">
    }>,
  ): Promise<void> {
    // Generate embeddings for all chunks
    const vectors = await Promise.all(
      chunks.map(async (chunk) => {
        const embedding = await generateEmbedding(chunk.text)
        return {
          id: chunk.id,
          values: embedding,
          metadata: {
            text: chunk.text,
            ...chunk.metadata,
          },
        }
      }),
    )

    // Store vectors
    await this.storeEmbeddings(vectors)
  }

  /**
   * Search for similar vectors
   */
  async search(queryText: string, options: { topK?: number; filter?: object } = {}): Promise<SearchResult[]> {
    await this.ensureInitialized()
    const supabase = getSupabaseAdmin()

    try {
      // Generate embedding for query
      const queryEmbedding = await generateEmbedding(queryText)

      // Use Supabase's built-in similarity search
      let query = supabase
        .from("document_embeddings")
        .select("id, chunk_text, section_title, citations, metadata")
        .order("embedding <-> " + `'[${queryEmbedding.join(",")}]'`)
        .limit(options.topK || 10)

      // Apply filters if provided
      if (options.filter) {
        const filters = options.filter as Record<string, any>
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(`metadata->>${key}`, value)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error("Vector search error:", error)
        throw error
      }

      // Process results
      return (data || []).map((row: any, index: number) => ({
        id: row.id,
        score: 1 - index * 0.01, // Approximate score based on order
        metadata: {
          text: row.chunk_text,
          section: row.section_title,
          citations: row.citations || [],
          ...row.metadata,
        },
      }))
    } catch (error) {
      console.error("Vector search failed:", error)
      return []
    }
  }

  /**
   * Search by vector embedding
   */
  async searchByVector(embedding: number[], options: { topK?: number; filter?: object } = {}): Promise<SearchResult[]> {
    await this.ensureInitialized()
    const supabase = getSupabaseAdmin()

    try {
      // Use Supabase's built-in similarity search
      let query = supabase
        .from("document_embeddings")
        .select("id, chunk_text, section_title, citations, metadata")
        .order("embedding <-> " + `'[${embedding.join(",")}]'`)
        .limit(options.topK || 10)

      // Apply filters if provided
      if (options.filter) {
        const filters = options.filter as Record<string, any>
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(`metadata->>${key}`, value)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error("Vector search error:", error)
        throw error
      }

      // Process results
      return (data || []).map((row: any, index: number) => ({
        id: row.id,
        score: 1 - index * 0.01, // Approximate score based on order
        metadata: {
          text: row.chunk_text,
          section: row.section_title,
          citations: row.citations || [],
          ...row.metadata,
        },
      }))
    } catch (error) {
      console.error("Vector search by embedding failed:", error)
      return []
    }
  }

  /**
   * Delete vectors by IDs
   */
  async deleteVectors(ids: string[]): Promise<void> {
    await this.ensureInitialized()
    const supabase = getSupabaseAdmin()

    const { error } = await supabase.from("document_embeddings").delete().in("id", ids)

    if (error) {
      console.error("Error deleting vectors:", error)
      throw error
    }
  }

  /**
   * Delete vectors by filter
   */
  async deleteVectorsByFilter(filter: object): Promise<void> {
    await this.ensureInitialized()
    const supabase = getSupabaseAdmin()

    const filters = filter as Record<string, any>
    let query = supabase.from("document_embeddings").delete()

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(`metadata->>${key}`, value)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting vectors by filter:", error)
      throw error
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureInitialized()
      const supabase = getSupabaseAdmin()

      const { error } = await supabase.from("document_embeddings").select("id").limit(1)
      return !error
    } catch (error) {
      console.error("Vector database health check failed:", error)
      return false
    }
  }

  /**
   * Ensure client is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }
}

// Singleton instance
export const vectorClient = new VectorClient()
