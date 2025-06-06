import type { NextRequest } from "next/server"
import { insertLegalDocument, insertDocumentEmbedding } from "@/lib/database"
import { generateEmbeddings, chunkText } from "@/lib/embeddings"

interface DocumentIngestRequest {
  title: string
  content: string
  documentType: string
  jurisdiction?: string
  practiceArea?: string
  source: string
  sourceUrl?: string
  metadata?: any
}

export async function POST(req: NextRequest) {
  try {
    const document: DocumentIngestRequest = await req.json()

    if (!document.title || !document.content || !document.documentType) {
      return new Response("Missing required fields", { status: 400 })
    }

    // Step 1: Insert the legal document
    const documentId = await insertLegalDocument({
      title: document.title,
      content: document.content,
      documentTypeCode: document.documentType,
      jurisdictionCode: document.jurisdiction,
      practiceAreaCode: document.practiceArea,
      source: document.source,
      sourceUrl: document.sourceUrl,
      metadata: document.metadata,
    })

    if (!documentId) {
      throw new Error("Failed to insert document")
    }

    // Step 2: Chunk the document content
    const chunks = chunkText(document.content, 1000, 100)

    // Step 3: Generate embeddings for each chunk
    const embeddings = await generateEmbeddings(chunks)

    // Step 4: Insert embeddings into the database
    const embeddingPromises = chunks.map(async (chunk, index) => {
      return insertDocumentEmbedding({
        documentId: documentId.toString(),
        chunkIndex: index,
        chunkText: chunk,
        embedding: embeddings[index],
        sectionTitle: extractSectionTitle(chunk),
        citations: extractCitations(chunk),
        metadata: {
          chunkSize: chunk.length,
          documentTitle: document.title,
          source: document.source,
        },
      })
    })

    await Promise.all(embeddingPromises)

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        chunksProcessed: chunks.length,
        message: "Document successfully ingested and indexed",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Document ingestion error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to ingest document",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

function extractSectionTitle(chunk: string): string | undefined {
  // Look for common legal section patterns
  const patterns = [
    /^([A-Z][A-Z\s]+)$/m, // ALL CAPS headings
    /^(\d+\.\s+[A-Z][^.]+)/, // Numbered sections
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*):/, // Title Case with colon
  ]

  for (const pattern of patterns) {
    const match = chunk.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  return undefined
}

function extractCitations(chunk: string): string[] {
  const citations: string[] = []

  // Common legal citation patterns
  const patterns = [
    /\b\d+\s+U\.S\.\s+\d+/g, // U.S. Supreme Court
    /\b\d+\s+F\.\d+d?\s+\d+/g, // Federal courts
    /\b\d+\s+S\.Ct\.\s+\d+/g, // Supreme Court Reporter
    /\b[A-Z][a-z]+\s+v\.\s+[A-Z][a-z]+/g, // Case names
  ]

  for (const pattern of patterns) {
    const matches = chunk.match(pattern)
    if (matches) {
      citations.push(...matches)
    }
  }

  return [...new Set(citations)] // Remove duplicates
}
