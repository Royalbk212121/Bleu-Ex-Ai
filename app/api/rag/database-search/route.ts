import { NextResponse } from "next/server"
import { executeRawQuery } from "@/lib/db"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: Request) {
  try {
    const { query, limit = 10, filters = {} } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query)

    // Search for similar documents using vector similarity
    const results = await searchSimilarDocuments(queryEmbedding, limit, filters)

    return NextResponse.json({
      query,
      results,
      totalFound: results.length,
      searchType: "vector_database",
    })
  } catch (error) {
    console.error("Database vector search error:", error)
    return NextResponse.json({ error: "Vector search failed" }, { status: 500 })
  }
}

async function searchSimilarDocuments(queryEmbedding: number[], limit: number, filters: any) {
  try {
    // Convert embedding to PostgreSQL vector format
    const embeddingVector = `[${queryEmbedding.join(",")}]`

    // Build the search query with filters
    let whereClause = "WHERE 1=1"
    const params = [embeddingVector, limit]
    let paramIndex = 3

    if (filters.jurisdiction) {
      whereClause += ` AND j.code = $${paramIndex}`
      params.push(filters.jurisdiction)
      paramIndex++
    }

    if (filters.practiceArea) {
      whereClause += ` AND pa.code = $${paramIndex}`
      params.push(filters.practiceArea)
      paramIndex++
    }

    if (filters.documentType) {
      whereClause += ` AND dt.code = $${paramIndex}`
      params.push(filters.documentType)
      paramIndex++
    }

    const searchQuery = `
      SELECT 
        de.id,
        de.chunk_text,
        de.section_title,
        de.citations,
        ld.title,
        ld.source,
        ld.source_url,
        dt.name as document_type,
        j.name as jurisdiction,
        pa.name as practice_area,
        (1 - (de.embedding <=> $1::vector)) as similarity_score
      FROM document_embeddings de
      JOIN legal_documents ld ON de.document_id = ld.id
      LEFT JOIN document_types dt ON ld.document_type_id = dt.id
      LEFT JOIN jurisdictions j ON ld.jurisdiction_id = j.id
      LEFT JOIN practice_areas pa ON ld.practice_area_id = pa.id
      ${whereClause}
      ORDER BY de.embedding <=> $1::vector
      LIMIT $2
    `

    const results = await executeRawQuery(searchQuery, params)

    return results.map((row: any, index: number) => ({
      id: row.id,
      title: row.title,
      content: row.chunk_text,
      section: row.section_title,
      citations: row.citations || [],
      source: row.source,
      sourceUrl: row.source_url,
      documentType: row.document_type,
      jurisdiction: row.jurisdiction,
      practiceArea: row.practice_area,
      similarity: Number.parseFloat(row.similarity_score) || 0,
      rank: index + 1,
      sourceType: "database",
    }))
  } catch (error) {
    console.error("Vector search query error:", error)
    // Fallback to text search if vector search fails
    return await fallbackTextSearch(filters.query || "", limit, filters)
  }
}

async function fallbackTextSearch(query: string, limit: number, filters: any) {
  try {
    let whereClause = "WHERE to_tsvector('english', ld.content) @@ plainto_tsquery('english', $1)"
    const params = [query, limit]
    let paramIndex = 3

    if (filters.jurisdiction) {
      whereClause += ` AND j.code = $${paramIndex}`
      params.push(filters.jurisdiction)
      paramIndex++
    }

    const fallbackQuery = `
      SELECT 
        ld.id,
        ld.title,
        ld.content,
        ld.source,
        ld.source_url,
        dt.name as document_type,
        j.name as jurisdiction,
        pa.name as practice_area,
        ts_rank(to_tsvector('english', ld.content), plainto_tsquery('english', $1)) as rank_score
      FROM legal_documents ld
      LEFT JOIN document_types dt ON ld.document_type_id = dt.id
      LEFT JOIN jurisdictions j ON ld.jurisdiction_id = j.id
      LEFT JOIN practice_areas pa ON ld.practice_area_id = pa.id
      ${whereClause}
      ORDER BY rank_score DESC
      LIMIT $2
    `

    const results = await executeRawQuery(fallbackQuery, params)

    return results.map((row: any, index: number) => ({
      id: row.id,
      title: row.title,
      content: row.content?.substring(0, 500) + "...",
      source: row.source,
      sourceUrl: row.source_url,
      documentType: row.document_type,
      jurisdiction: row.jurisdiction,
      practiceArea: row.practice_area,
      similarity: Number.parseFloat(row.rank_score) || 0,
      rank: index + 1,
      sourceType: "database_text",
    }))
  } catch (error) {
    console.error("Fallback text search error:", error)
    return []
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey) {
      throw new Error("Google AI API key not found")
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" })

    const result = await embeddingModel.embedContent(text)
    return result.embedding.values
  } catch (error) {
    console.error("Embedding generation error:", error)
    throw error
  }
}
