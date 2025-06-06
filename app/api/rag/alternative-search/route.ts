import { NextResponse } from "next/server"
import { KeywordBasedRAG, chunkDocument } from "@/lib/alternative-rag"
import { executeRawQuery } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { query, limit = 5 } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Initialize the keyword-based RAG system
    const ragSystem = new KeywordBasedRAG()

    // Fetch documents from the database
    const documents = await fetchLegalDocuments()

    // Add documents to the RAG system
    ragSystem.addDocuments(documents)

    // Search for relevant documents
    const results = ragSystem.search(query, limit)

    return NextResponse.json({
      query,
      results,
      totalResults: results.length,
    })
  } catch (error) {
    console.error("Alternative RAG search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}

async function fetchLegalDocuments() {
  try {
    // Fetch documents from the database
    const documents = await executeRawQuery(`
      SELECT 
        id, 
        title, 
        content, 
        source,
        metadata,
        key_terms,
        citations
      FROM legal_documents
      WHERE content IS NOT NULL
      LIMIT 100
    `)

    // Process and chunk documents
    const processedDocs = []

    for (const doc of documents) {
      if (!doc.content) continue

      // Create chunks from the document
      const chunks = chunkDocument(doc.content, 1000, 200)

      // Add each chunk as a separate document
      chunks.forEach((chunk, index) => {
        processedDocs.push({
          id: `${doc.id}-chunk-${index}`,
          content: chunk.text,
          metadata: {
            title: doc.title,
            source: doc.source,
            originalId: doc.id,
            chunkIndex: index,
            keyTerms: doc.key_terms,
            citations: doc.citations,
            ...doc.metadata,
          },
        })
      })
    }

    return processedDocs
  } catch (error) {
    console.error("Error fetching legal documents:", error)
    return []
  }
}
