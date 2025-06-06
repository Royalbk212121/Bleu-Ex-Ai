/**
 * Embedding Service - High-performance text embeddings
 * Handles vector generation for semantic search and RAG
 */
import { embed, embedMany } from "ai"
import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"

export type EmbeddingModel = "text-embedding-3-large" | "text-embedding-3-small" | "text-embedding-004"

interface EmbeddingRequest {
  text: string | string[]
  model?: EmbeddingModel
  dimensions?: number
}

interface EmbeddingResponse {
  embeddings: number[][]
  model: string
  dimensions: number
  usage: {
    promptTokens: number
    totalTokens: number
  }
}

interface EmbeddingConfig {
  model: EmbeddingModel
  provider: "openai" | "google"
  dimensions: number
  maxTokens: number
  costPerToken: number
  enabled: boolean
}

/**
 * Embedding service for generating vector embeddings
 */
export class EmbeddingService {
  private configs: Map<EmbeddingModel, EmbeddingConfig> = new Map()
  private cache: Map<string, number[]> = new Map()
  private cacheSize = 10000 // Maximum cache entries

  constructor() {
    this.initializeConfigs()
  }

  /**
   * Initialize embedding model configurations
   */
  private initializeConfigs() {
    const configs: EmbeddingConfig[] = [
      {
        model: "text-embedding-3-large",
        provider: "openai",
        dimensions: 3072,
        maxTokens: 8191,
        costPerToken: 0.00000013,
        enabled: true,
      },
      {
        model: "text-embedding-3-small",
        provider: "openai",
        dimensions: 1536,
        maxTokens: 8191,
        costPerToken: 0.00000002,
        enabled: true,
      },
      {
        model: "text-embedding-004",
        provider: "google",
        dimensions: 768,
        maxTokens: 2048,
        costPerToken: 0.00000001,
        enabled: true,
      },
    ]

    configs.forEach((config) => {
      this.configs.set(config.model, config)
    })
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = request.model || "text-embedding-3-large"
    const config = this.configs.get(model)

    if (!config || !config.enabled) {
      throw new Error(`Embedding model ${model} is not available`)
    }

    const texts = Array.isArray(request.text) ? request.text : [request.text]
    const embeddings: number[][] = []
    let totalTokens = 0

    // Check cache first
    const uncachedTexts: string[] = []
    const cachedEmbeddings: Map<string, number[]> = new Map()

    for (const text of texts) {
      const cacheKey = this.getCacheKey(text, model)
      const cached = this.cache.get(cacheKey)

      if (cached) {
        cachedEmbeddings.set(text, cached)
      } else {
        uncachedTexts.push(text)
      }
    }

    // Generate embeddings for uncached texts
    if (uncachedTexts.length > 0) {
      try {
        let result: any

        if (uncachedTexts.length === 1) {
          // Single embedding
          switch (config.provider) {
            case "openai":
              result = await embed({
                model: openai.embedding(model),
                value: uncachedTexts[0],
              })
              embeddings.push(result.embedding)
              break

            case "google":
              result = await embed({
                model: google.embedding(model),
                value: uncachedTexts[0],
              })
              embeddings.push(result.embedding)
              break
          }
        } else {
          // Batch embeddings
          switch (config.provider) {
            case "openai":
              result = await embedMany({
                model: openai.embedding(model),
                values: uncachedTexts,
              })
              embeddings.push(...result.embeddings)
              break

            case "google":
              // Google doesn't support batch, process individually
              for (const text of uncachedTexts) {
                const singleResult = await embed({
                  model: google.embedding(model),
                  value: text,
                })
                embeddings.push(singleResult.embedding)
              }
              break
          }
        }

        totalTokens = result.usage?.totalTokens || this.estimateTokens(uncachedTexts)

        // Cache new embeddings
        uncachedTexts.forEach((text, index) => {
          const cacheKey = this.getCacheKey(text, model)
          this.addToCache(cacheKey, embeddings[index])
        })
      } catch (error) {
        console.error(`Embedding generation error with ${model}:`, error)
        throw error
      }
    }

    // Combine cached and new embeddings in original order
    const finalEmbeddings: number[][] = []
    for (const text of texts) {
      const cached = cachedEmbeddings.get(text)
      if (cached) {
        finalEmbeddings.push(cached)
      } else {
        const index = uncachedTexts.indexOf(text)
        if (index >= 0) {
          finalEmbeddings.push(embeddings[index])
        }
      }
    }

    return {
      embeddings: finalEmbeddings,
      model,
      dimensions: config.dimensions,
      usage: {
        promptTokens: totalTokens,
        totalTokens,
      },
    }
  }

  /**
   * Generate single embedding
   */
  async generateEmbedding(text: string, model?: EmbeddingModel): Promise<number[]> {
    const result = await this.generateEmbeddings({ text, model })
    return result.embeddings[0]
  }

  /**
   * Generate embeddings for document chunks
   */
  async generateDocumentEmbeddings(chunks: string[], model?: EmbeddingModel, batchSize = 100): Promise<number[][]> {
    const allEmbeddings: number[][] = []

    // Process in batches to avoid rate limits
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const result = await this.generateEmbeddings({ text: batch, model })
      allEmbeddings.push(...result.embeddings)

      // Add delay between batches
      if (i + batchSize < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return allEmbeddings
  }

  /**
   * Calculate similarity between embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error("Embeddings must have the same dimensions")
    }

    // Cosine similarity
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * Find most similar embeddings
   */
  findMostSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: number[][],
    topK = 5,
  ): Array<{ index: number; similarity: number }> {
    const similarities = candidateEmbeddings.map((embedding, index) => ({
      index,
      similarity: this.calculateSimilarity(queryEmbedding, embedding),
    }))

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
  }

  /**
   * Get cache key for text and model
   */
  private getCacheKey(text: string, model: EmbeddingModel): string {
    // Use first 100 chars + hash for cache key
    const textKey = text.length > 100 ? text.substring(0, 100) + `_${text.length}` : text
    return `${model}:${textKey}`
  }

  /**
   * Add embedding to cache
   */
  private addToCache(key: string, embedding: number[]) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.cacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, embedding)
  }

  /**
   * Estimate token count for text
   */
  private estimateTokens(texts: string[]): number {
    // Rough estimation: 1 token ≈ 4 characters
    const totalChars = texts.reduce((sum, text) => sum + text.length, 0)
    return Math.ceil(totalChars / 4)
  }

  /**
   * Clear embedding cache
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.cacheSize,
      hitRate: this.cache.size > 0 ? "Available" : "Empty",
    }
  }

  /**
   * Health check for embedding service
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {}

    for (const [model, config] of this.configs.entries()) {
      if (!config.enabled) {
        health[model] = false
        continue
      }

      try {
        await this.generateEmbedding("test", model)
        health[model] = true
      } catch {
        health[model] = false
      }
    }

    return health
  }
}

export const embeddingService = new EmbeddingService()
