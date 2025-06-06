import { google } from "@ai-sdk/google"
import { embed } from "ai"

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: google.embedding("text-embedding-004"),
      value: text,
    })

    return embedding
  } catch (error) {
    console.error("Embedding generation error:", error)
    // Fallback to a simple hash-based embedding for development
    return generateSimpleEmbedding(text)
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const embeddings = await Promise.all(texts.map((text) => generateEmbedding(text)))
    return embeddings
  } catch (error) {
    console.error("Batch embedding generation error:", error)
    return texts.map((text) => generateSimpleEmbedding(text))
  }
}

// Fallback simple embedding for development/testing
function generateSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/)
  const embedding = new Array(384).fill(0) // Standard embedding dimension

  // Simple hash-based embedding
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j)
      const index = (charCode + i + j) % embedding.length
      embedding[index] += 1
    }
  }

  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map((val) => (magnitude > 0 ? val / magnitude : 0))
}

// Chunk text for embedding
export function chunkText(text: string, maxChunkSize = 1000, overlap = 100): string[] {
  const chunks: string[] = []
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)

  let currentChunk = ""
  let currentSize = 0

  for (const sentence of sentences) {
    const sentenceSize = sentence.length

    if (currentSize + sentenceSize > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())

      // Create overlap by keeping last few sentences
      const overlapSentences = currentChunk.split(/[.!?]+/).slice(-2)
      currentChunk = overlapSentences.join(". ") + ". " + sentence
      currentSize = currentChunk.length
    } else {
      currentChunk += sentence + ". "
      currentSize += sentenceSize
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}
