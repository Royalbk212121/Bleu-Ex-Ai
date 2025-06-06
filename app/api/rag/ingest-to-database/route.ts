import { NextResponse } from "next/server"
import { executeRawQuery } from "@/lib/db"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: Request) {
  try {
    const { documents } = await request.json()

    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json({ error: "Documents array is required" }, { status: 400 })
    }

    const processedDocuments = []

    for (const doc of documents) {
      try {
        const processed = await ingestDocumentToDatabase(doc)
        processedDocuments.push(processed)
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error)
        processedDocuments.push({
          documentId: doc.id,
          success: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedDocuments.length,
      documents: processedDocuments,
    })
  } catch (error) {
    console.error("Document ingestion error:", error)
    return NextResponse.json({ error: "Failed to ingest documents" }, { status: 500 })
  }
}

async function ingestDocumentToDatabase(document: any) {
  // Insert the main document
  const documentResult = await executeRawQuery(
    `
    INSERT INTO legal_documents (
      title, content, summary, key_terms, citations, 
      document_type_id, jurisdiction_id, practice_area_id,
      source, source_url, metadata
    )
    SELECT 
      $1, $2, $3, $4, $5,
      dt.id, j.id, pa.id,
      $9, $10, $11
    FROM document_types dt
    LEFT JOIN jurisdictions j ON j.code = $6
    LEFT JOIN practice_areas pa ON pa.code = $7
    WHERE dt.code = $8
    RETURNING id
  `,
    [
      document.title,
      document.content,
      document.summary || null,
      document.keyTerms || [],
      document.citations || [],
      document.jurisdiction || "US",
      document.practiceArea || "CONST",
      document.documentType || "FED_COURT",
      document.source || "Manual Upload",
      document.sourceUrl || null,
      JSON.stringify(document.metadata || {}),
    ],
  )

  const documentId = documentResult[0]?.id

  if (!documentId) {
    throw new Error("Failed to insert document")
  }

  // Create chunks and embeddings
  const chunks = await chunkDocument(document.content, document.metadata)
  const embeddedChunks = []

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const embedding = await generateEmbedding(chunk.text)

    // Insert embedding into database
    await executeRawQuery(
      `
      INSERT INTO document_embeddings (
        document_id, chunk_index, chunk_text, embedding,
        section_title, citations, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        documentId,
        i,
        chunk.text,
        JSON.stringify(embedding), // Store as JSON for now
        chunk.metadata?.section || "General",
        chunk.metadata?.citations || [],
        JSON.stringify(chunk.metadata || {}),
      ],
    )

    embeddedChunks.push({
      chunkIndex: i,
      text: chunk.text.substring(0, 100) + "...",
      embeddingDimension: embedding.length,
    })
  }

  return {
    documentId,
    title: document.title,
    chunks: embeddedChunks.length,
    success: true,
    embeddedChunks: embeddedChunks.slice(0, 3), // Show first 3 chunks
  }
}

async function chunkDocument(content: string, metadata: any) {
  const chunks = []
  const maxChunkSize = 1000 // Smaller chunks for better embeddings

  // Split by sections first
  const sections = content.split(/(?=SECTION [IVX\d]+:)/i)

  for (const section of sections) {
    if (section.trim().length < 50) continue

    // If section is small enough, use as one chunk
    if (section.length <= maxChunkSize) {
      chunks.push({
        text: section.trim(),
        metadata: {
          ...metadata,
          section: extractSection(section),
          citations: extractCitations(section),
        },
      })
    } else {
      // Split large sections by paragraphs
      const paragraphs = section.split(/\n\s*\n/)
      let currentChunk = ""

      for (const paragraph of paragraphs) {
        if ((currentChunk + paragraph).length <= maxChunkSize) {
          currentChunk += (currentChunk ? "\n\n" : "") + paragraph
        } else {
          if (currentChunk) {
            chunks.push({
              text: currentChunk.trim(),
              metadata: {
                ...metadata,
                section: extractSection(currentChunk),
                citations: extractCitations(currentChunk),
              },
            })
          }
          currentChunk = paragraph
        }
      }

      if (currentChunk) {
        chunks.push({
          text: currentChunk.trim(),
          metadata: {
            ...metadata,
            section: extractSection(currentChunk),
            citations: extractCitations(currentChunk),
          },
        })
      }
    }
  }

  return chunks
}

function extractSection(text: string): string {
  const sectionMatch = text.match(/^(SECTION|Article|Chapter|Part)\s+([IVX\d]+)/i)
  return sectionMatch ? sectionMatch[0] : "General"
}

function extractCitations(text: string): string[] {
  const citationPatterns = [
    /\d+\s+U\.S\.?\s+\d+/g,
    /\d+\s+F\.\d+d?\s+\d+/g,
    /\d+\s+U\.S\.C\.?\s+§?\s*\d+/g,
    /\d+\s+C\.F\.R\.?\s+§?\s*\d+/g,
  ]

  const citations: string[] = []
  citationPatterns.forEach((pattern) => {
    const matches = text.match(pattern)
    if (matches) citations.push(...matches)
  })

  return citations
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey) {
      console.warn("Google AI API key not found, using dummy embeddings")
      return generateDummyEmbedding()
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" })

    const result = await embeddingModel.embedContent(text)
    return result.embedding.values
  } catch (error) {
    console.error("Embedding generation error:", error)
    return generateDummyEmbedding()
  }
}

function generateDummyEmbedding(): number[] {
  return Array.from({ length: 768 }, () => Math.random() * 2 - 1)
}
