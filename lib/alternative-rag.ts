/**
 * Alternative RAG implementation that doesn't require vector database
 * Uses keyword-based search and BM25 ranking algorithm
 */

export interface Document {
  id: string
  content: string
  metadata?: any
}

export interface SearchResult {
  id: string
  content: string
  score: number
  metadata?: any
}

export class KeywordBasedRAG {
  private documents: Document[] = []

  // Add documents to the in-memory store
  addDocuments(documents: Document[]): void {
    this.documents = [...this.documents, ...documents]
  }

  // Clear all documents
  clearDocuments(): void {
    this.documents = []
  }

  // Search for documents using BM25 algorithm
  search(query: string, limit = 5): SearchResult[] {
    const queryTerms = this.tokenize(query)

    // Calculate document frequencies
    const documentFrequencies: Record<string, number> = {}
    for (const term of queryTerms) {
      documentFrequencies[term] = this.documents.filter((doc) => this.tokenize(doc.content).includes(term)).length
    }

    // Calculate BM25 scores for each document
    const k1 = 1.2 // Term frequency saturation
    const b = 0.75 // Length normalization
    const avgDocLength =
      this.documents.reduce((sum, doc) => sum + this.tokenize(doc.content).length, 0) / this.documents.length || 1

    const results: SearchResult[] = []

    for (const doc of this.documents) {
      const docTerms = this.tokenize(doc.content)
      const docLength = docTerms.length

      let score = 0
      for (const term of queryTerms) {
        const tf = docTerms.filter((t) => t === term).length // Term frequency
        const df = documentFrequencies[term] || 0 // Document frequency
        const idf = Math.log(1 + (this.documents.length - df + 0.5) / (df + 0.5)) // Inverse document frequency

        // BM25 formula
        const termScore = idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / avgDocLength))))
        score += termScore
      }

      if (score > 0) {
        results.push({
          id: doc.id,
          content: doc.content,
          score,
          metadata: doc.metadata,
        })
      }
    }

    // Sort by score and limit results
    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  // Simple tokenization function
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter((term) => term.length > 2) // Filter out short terms
  }
}

// Helper function to extract chunks from a document
export function chunkDocument(content: string, chunkSize = 500, overlap = 100): { text: string; metadata?: any }[] {
  const chunks: { text: string; metadata?: any }[] = []

  // Split by paragraphs first
  const paragraphs = content.split(/\n\s*\n/)

  let currentChunk = ""

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size, save current chunk and start new one
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push({ text: currentChunk })

      // Keep overlap from previous chunk
      const words = currentChunk.split(" ")
      if (words.length > overlap / 5) {
        // Approximate words to chars
        currentChunk = words.slice(-Math.floor(overlap / 5)).join(" ")
      } else {
        currentChunk = ""
      }
    }

    // Add paragraph to current chunk
    currentChunk += (currentChunk ? "\n\n" : "") + paragraph
  }

  // Add the last chunk if not empty
  if (currentChunk.trim().length > 0) {
    chunks.push({ text: currentChunk })
  }

  return chunks
}
