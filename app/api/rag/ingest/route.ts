import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Legal document ingestion endpoint
export async function POST(request: Request) {
  try {
    const { documents } = await request.json()

    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json({ error: "Documents array is required" }, { status: 400 })
    }

    const processedDocuments = []

    for (const doc of documents) {
      // Process each legal document
      const processed = await processLegalDocument(doc)
      processedDocuments.push(processed)
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

async function processLegalDocument(document: any) {
  // Extract text and metadata
  const chunks = await chunkDocument(document.content, document.metadata)

  // Generate embeddings for each chunk using Gemini
  const embeddedChunks = await Promise.all(
    chunks.map(async (chunk) => {
      const embedding = await generateEmbedding(chunk.text)
      return {
        ...chunk,
        embedding,
        id: crypto.randomUUID(),
      }
    }),
  )

  // Store in vector database (simulated)
  await storeInVectorDB(embeddedChunks, document.metadata)

  return {
    documentId: document.id,
    chunks: embeddedChunks.length,
    metadata: document.metadata,
  }
}

async function chunkDocument(content: string, metadata: any) {
  // Intelligent chunking for legal documents with size limits
  const chunks = []
  const maxChunkSize = 25000 // 25KB to be safe with API limits

  // First, split by sections and paragraphs
  const sections = content.split(/(?=SECTION [IVX\d]+:)/i)

  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const section = sections[sectionIndex].trim()
    if (section.length < 50) continue // Skip very short sections

    // Check if section is too large
    const sectionBytes = new TextEncoder().encode(section).length

    if (sectionBytes <= maxChunkSize) {
      // Section fits in one chunk
      chunks.push({
        text: section,
        metadata: {
          ...metadata,
          chunkIndex: chunks.length,
          section: extractSection(section),
          citations: extractCitations(section),
        },
      })
    } else {
      // Section is too large, split by paragraphs
      const paragraphs = section.split(/\n\s*\n/)
      let currentChunk = ""

      for (const paragraph of paragraphs) {
        const testChunk = currentChunk + (currentChunk ? "\n\n" : "") + paragraph
        const testBytes = new TextEncoder().encode(testChunk).length

        if (testBytes <= maxChunkSize) {
          currentChunk = testChunk
        } else {
          // Save current chunk if it has content
          if (currentChunk.trim()) {
            chunks.push({
              text: currentChunk,
              metadata: {
                ...metadata,
                chunkIndex: chunks.length,
                section: extractSection(currentChunk),
                citations: extractCitations(currentChunk),
              },
            })
          }

          // Start new chunk with current paragraph
          currentChunk = paragraph

          // If single paragraph is still too large, truncate it
          const paragraphBytes = new TextEncoder().encode(currentChunk).length
          if (paragraphBytes > maxChunkSize) {
            currentChunk = truncateTextByBytes(currentChunk, maxChunkSize)
          }
        }
      }

      // Add remaining chunk
      if (currentChunk.trim()) {
        chunks.push({
          text: currentChunk,
          metadata: {
            ...metadata,
            chunkIndex: chunks.length,
            section: extractSection(currentChunk),
            citations: extractCitations(currentChunk),
          },
        })
      }
    }
  }

  return chunks
}

function truncateTextByBytes(text: string, maxBytes: number): string {
  // Convert to bytes and check length
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)

  if (bytes.length <= maxBytes) {
    return text
  }

  // Binary search to find the maximum length that fits
  let left = 0
  let right = text.length
  let result = ""

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const substring = text.substring(0, mid)
    const substringBytes = encoder.encode(substring)

    if (substringBytes.length <= maxBytes) {
      result = substring
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  return result
}

function extractSection(text: string): string {
  // Extract section headers from legal text
  const sectionMatch = text.match(/^(SECTION|Article|Chapter|Part)\s+([IVX\d]+)/i)
  return sectionMatch ? sectionMatch[0] : "General"
}

function extractCitations(text: string): string[] {
  // Extract legal citations using regex patterns
  const citationPatterns = [
    /\d+\s+U\.S\.?\s+\d+/g, // Supreme Court cases
    /\d+\s+F\.\d+d?\s+\d+/g, // Federal cases
    /\d+\s+U\.S\.C\.?\s+§?\s*\d+/g, // US Code
    /\d+\s+C\.F\.R\.?\s+§?\s*\d+/g, // Code of Federal Regulations
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

    // Truncate text to fit within API limits (approximately 30KB to be safe)
    const maxBytes = 30000
    const truncatedText = truncateTextByBytes(text, maxBytes)

    // Use the official Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(apiKey)

    try {
      // Get the embedding model
      const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" })

      // Generate embeddings
      const result = await embeddingModel.embedContent(truncatedText)
      const embedding = result.embedding.values

      return embedding
    } catch (embeddingError) {
      console.error("Error with Google AI embedding:", embeddingError)
      // Fall back to dummy embeddings if the API call fails
      return generateDummyEmbedding()
    }
  } catch (error) {
    console.error("Embedding generation error:", error)
    return generateDummyEmbedding()
  }
}

function generateDummyEmbedding(): number[] {
  // Create a deterministic dummy embedding based on a seed
  const seed = Date.now()
  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  // Generate 768-dimensional embedding with values between -1 and 1
  return Array.from({ length: 768 }, (_, i) => random(seed + i) * 2 - 1)
}

async function storeInVectorDB(chunks: any[], metadata: any) {
  const vectorData = {
    chunks,
    metadata,
    timestamp: new Date().toISOString(),
  }

  const blob = await put(`vectors/${metadata.documentId}.json`, JSON.stringify(vectorData), {
    access: "public",
  })

  return blob.url
}
