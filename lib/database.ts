import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

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

// Legal document queries
export async function insertLegalDocument(document: {
  title: string
  content: string
  documentTypeCode: string
  jurisdictionCode?: string
  practiceAreaCode?: string
  source: string
  sourceUrl?: string
  metadata?: any
}) {
  const query = `
    INSERT INTO legal_documents (
      title, content, document_type_id, jurisdiction_id, practice_area_id, 
      source, source_url, metadata
    )
    SELECT 
      $1, $2, dt.id, j.id, pa.id, $6, $7, $8
    FROM document_types dt
    LEFT JOIN jurisdictions j ON j.code = $4
    LEFT JOIN practice_areas pa ON pa.code = $5
    WHERE dt.code = $3
    RETURNING id
  `

  const result = await executeQuery(query, [
    document.title,
    document.content,
    document.documentTypeCode,
    document.jurisdictionCode,
    document.practiceAreaCode,
    document.source,
    document.sourceUrl,
    JSON.stringify(document.metadata || {}),
  ])

  return result[0]?.id
}

// Search legal documents with vector similarity
export async function searchLegalDocuments(params: {
  query?: string
  jurisdiction?: string
  practiceArea?: string
  documentType?: string
  limit?: number
  offset?: number
}) {
  const whereConditions = []
  const queryParams = []
  let paramIndex = 1

  if (params.query) {
    whereConditions.push(`to_tsvector('english', ld.content) @@ plainto_tsquery('english', $${paramIndex})`)
    queryParams.push(params.query)
    paramIndex++
  }

  if (params.jurisdiction) {
    whereConditions.push(`j.code = $${paramIndex}`)
    queryParams.push(params.jurisdiction)
    paramIndex++
  }

  if (params.practiceArea) {
    whereConditions.push(`pa.code = $${paramIndex}`)
    queryParams.push(params.practiceArea)
    paramIndex++
  }

  if (params.documentType) {
    whereConditions.push(`dt.code = $${paramIndex}`)
    queryParams.push(params.documentType)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

  const query = `
    SELECT 
      ld.id, ld.title, ld.content, ld.summary, ld.key_terms, ld.citations,
      ld.publication_date, ld.source, ld.source_url, ld.created_at,
      dt.name as document_type, dt.category,
      j.name as jurisdiction, j.code as jurisdiction_code,
      pa.name as practice_area, pa.code as practice_area_code
    FROM legal_documents ld
    LEFT JOIN document_types dt ON ld.document_type_id = dt.id
    LEFT JOIN jurisdictions j ON ld.jurisdiction_id = j.id
    LEFT JOIN practice_areas pa ON ld.practice_area_id = pa.id
    ${whereClause}
    ORDER BY ld.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `

  queryParams.push(params.limit || 50, params.offset || 0)

  return await executeQuery(query, queryParams)
}

// Vector similarity search for embeddings
export async function vectorSearch(queryEmbedding: number[], limit = 10) {
  try {
    const query = `
      SELECT 
        de.id,
        de.chunk_text,
        de.section_title,
        de.citations,
        de.metadata,
        ld.title as document_title,
        ld.source,
        ld.source_url,
        (de.embedding <=> $1::vector) as distance
      FROM document_embeddings de
      JOIN legal_documents ld ON de.document_id = ld.id
      ORDER BY de.embedding <=> $1::vector
      LIMIT $2
    `

    const result = await executeQuery(query, [JSON.stringify(queryEmbedding), limit])
    return result
  } catch (error) {
    console.error("Vector search error:", error)
    // Fallback to text search if vector search fails
    return []
  }
}

// Insert document embeddings
export async function insertDocumentEmbedding(params: {
  documentId: string
  chunkIndex: number
  chunkText: string
  embedding: number[]
  sectionTitle?: string
  citations?: string[]
  metadata?: any
}) {
  const query = `
    INSERT INTO document_embeddings (
      document_id, chunk_index, chunk_text, embedding, section_title, citations, metadata
    ) VALUES ($1, $2, $3, $4::vector, $5, $6, $7)
    RETURNING id
  `

  const result = await executeQuery(query, [
    params.documentId,
    params.chunkIndex,
    params.chunkText,
    JSON.stringify(params.embedding),
    params.sectionTitle,
    params.citations,
    JSON.stringify(params.metadata || {}),
  ])

  return result[0]?.id
}

// Get legal cases
export async function getLegalCases(params: {
  jurisdiction?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}) {
  const whereConditions = ["1=1"]
  const queryParams = []
  let paramIndex = 1

  if (params.jurisdiction) {
    whereConditions.push(`j.code = $${paramIndex}`)
    queryParams.push(params.jurisdiction)
    paramIndex++
  }

  if (params.dateFrom) {
    whereConditions.push(`lc.decision_date >= $${paramIndex}`)
    queryParams.push(params.dateFrom)
    paramIndex++
  }

  if (params.dateTo) {
    whereConditions.push(`lc.decision_date <= $${paramIndex}`)
    queryParams.push(params.dateTo)
    paramIndex++
  }

  const query = `
    SELECT 
      lc.id, lc.case_name, lc.case_number, lc.court, lc.decision_date,
      lc.citation, lc.summary, lc.outcome, lc.precedential_value,
      j.name as jurisdiction, j.code as jurisdiction_code
    FROM legal_cases lc
    LEFT JOIN jurisdictions j ON lc.jurisdiction_id = j.id
    WHERE ${whereConditions.join(" AND ")}
    ORDER BY lc.decision_date DESC
    LIMIT $${paramIndex}
  `

  queryParams.push(params.limit || 50)

  return await executeQuery(query, queryParams)
}

// Insert research query log
export async function logResearchQuery(params: {
  userId?: string
  queryText: string
  queryType: string
  resultsCount: number
  executionTimeMs: number
}) {
  const query = `
    INSERT INTO research_queries (
      user_id, query_text, query_type, results_count, execution_time_ms
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `

  const result = await executeQuery(query, [
    params.userId,
    params.queryText,
    params.queryType,
    params.resultsCount,
    params.executionTimeMs,
  ])

  return result[0]?.id
}
