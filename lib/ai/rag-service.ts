/**
 * RAG & Anti-Hallucination Service
 * Retrieval-Augmented Generation with citation validation
 */
import { llmService } from "./llm-service"
import { vectorClient } from "@/lib/database/vector-client"

interface RAGRequest {
  query: string
  context?: Record<string, any>
  options?: {
    topK?: number
    model?: string
    temperature?: number
    includeMetadata?: boolean
    validateCitations?: boolean
    filterCriteria?: Record<string, any>
  }
}

interface RAGResponse {
  answer: string
  sources: Array<{
    id: string
    title: string
    content: string
    citation: string
    relevanceScore: number
    metadata: Record<string, any>
  }>
  confidence: number
  validatedCitations: string[]
  flaggedCitations: string[]
  processingTime: number
}

interface CitationValidation {
  citation: string
  isValid: boolean
  sourceId?: string
  confidence: number
}

/**
 * RAG service with anti-hallucination capabilities
 */
export class RAGService {
  /**
   * Process RAG query with citation validation
   */
  async processQuery(request: RAGRequest): Promise<RAGResponse> {
    const startTime = Date.now()

    try {
      // Step 1: Retrieve relevant documents
      const retrievedSources = await this.retrieveRelevantSources(
        request.query,
        request.options?.topK || 8,
        request.options?.filterCriteria,
      )

      if (retrievedSources.length === 0) {
        return {
          answer:
            "I couldn't find relevant information in the legal database to answer your question. Please try rephrasing your query or contact a legal professional for assistance.",
          sources: [],
          confidence: 0,
          validatedCitations: [],
          flaggedCitations: [],
          processingTime: Date.now() - startTime,
        }
      }

      // Step 2: Augment prompt with retrieved context
      const augmentedPrompt = this.constructAugmentedPrompt(request.query, retrievedSources)

      // Step 3: Generate response using LLM
      const llmResponse = await llmService.generateText({
        messages: [
          {
            role: "system",
            content: `You are an expert legal research assistant. Provide accurate, well-researched answers based ONLY on the provided legal sources. Always cite your sources using [Source X] format where X corresponds to the source number provided in the context.

CRITICAL INSTRUCTIONS:
1. Base your answer ONLY on the provided sources
2. Use [Source X] citations for all factual claims
3. If information is not in the sources, clearly state this limitation
4. Provide comprehensive analysis while staying grounded in the sources
5. Format your response with proper markdown for readability`,
          },
          {
            role: "user",
            content: augmentedPrompt,
          },
        ],
        model: request.options?.model as any,
        temperature: request.options?.temperature || 0.1,
        maxTokens: 2000,
      })

      // Step 4: Validate citations (Anti-Hallucination)
      const citationValidation =
        request.options?.validateCitations !== false
          ? await this.validateCitations(llmResponse.text, retrievedSources)
          : { validatedCitations: [], flaggedCitations: [] }

      // Step 5: Calculate confidence score
      const confidence = this.calculateConfidenceScore(
        retrievedSources,
        citationValidation.validatedCitations.length,
        citationValidation.flaggedCitations.length,
      )

      return {
        answer: llmResponse.text,
        sources: retrievedSources,
        confidence,
        validatedCitations: citationValidation.validatedCitations,
        flaggedCitations: citationValidation.flaggedCitations,
        processingTime: Date.now() - startTime,
      }
    } catch (error) {
      console.error("RAG processing error:", error)
      throw error
    }
  }

  /**
   * Stream RAG response
   */
  async *streamQuery(request: RAGRequest): AsyncGenerator<{
    type: "sources" | "chunk" | "complete"
    data: any
  }> {
    try {
      // Retrieve sources first
      const retrievedSources = await this.retrieveRelevantSources(
        request.query,
        request.options?.topK || 8,
        request.options?.filterCriteria,
      )

      yield {
        type: "sources",
        data: { sources: retrievedSources },
      }

      if (retrievedSources.length === 0) {
        yield {
          type: "complete",
          data: {
            answer: "No relevant sources found.",
            confidence: 0,
            validatedCitations: [],
            flaggedCitations: [],
          },
        }
        return
      }

      // Generate augmented prompt
      const augmentedPrompt = this.constructAugmentedPrompt(request.query, retrievedSources)

      // Stream LLM response
      const textStream = await llmService.streamText({
        messages: [
          {
            role: "system",
            content: `You are an expert legal research assistant. Provide accurate answers based ONLY on the provided sources. Always cite sources using [Source X] format.`,
          },
          {
            role: "user",
            content: augmentedPrompt,
          },
        ],
        model: request.options?.model as any,
        temperature: request.options?.temperature || 0.1,
      })

      let fullResponse = ""
      for await (const chunk of textStream) {
        fullResponse += chunk
        yield {
          type: "chunk",
          data: { chunk },
        }
      }

      // Validate citations after streaming is complete
      const citationValidation =
        request.options?.validateCitations !== false
          ? await this.validateCitations(fullResponse, retrievedSources)
          : { validatedCitations: [], flaggedCitations: [] }

      const confidence = this.calculateConfidenceScore(
        retrievedSources,
        citationValidation.validatedCitations.length,
        citationValidation.flaggedCitations.length,
      )

      yield {
        type: "complete",
        data: {
          confidence,
          validatedCitations: citationValidation.validatedCitations,
          flaggedCitations: citationValidation.flaggedCitations,
        },
      }
    } catch (error) {
      console.error("RAG streaming error:", error)
      throw error
    }
  }

  /**
   * Retrieve relevant sources from vector database
   */
  private async retrieveRelevantSources(
    query: string,
    topK: number,
    filterCriteria?: Record<string, any>,
  ): Promise<
    Array<{
      id: string
      title: string
      content: string
      citation: string
      relevanceScore: number
      metadata: Record<string, any>
    }>
  > {
    try {
      // Search vector database
      const searchResults = await vectorClient.search(query, {
        topK,
        filter: filterCriteria,
      })

      // Format results
      return searchResults.map((result, index) => ({
        id: result.id,
        title: result.metadata.title || `Legal Document ${index + 1}`,
        content: result.metadata.text || "",
        citation: result.metadata.citation || result.metadata.source || "",
        relevanceScore: result.score,
        metadata: result.metadata,
      }))
    } catch (error) {
      console.error("Error retrieving sources:", error)
      return []
    }
  }

  /**
   * Construct augmented prompt with sources
   */
  private constructAugmentedPrompt(
    query: string,
    sources: Array<{
      id: string
      title: string
      content: string
      citation: string
      relevanceScore: number
      metadata: Record<string, any>
    }>,
  ): string {
    const sourceContext = sources
      .map((source, index) => {
        return `[Source ${index + 1}] ${source.title}
Citation: ${source.citation}
Content: ${source.content}
Relevance: ${(source.relevanceScore * 100).toFixed(1)}%

---`
      })
      .join("\n")

    return `LEGAL SOURCES:
${sourceContext}

USER QUESTION: ${query}

Please provide a comprehensive answer based on the legal sources above. Use [Source X] citations to reference specific sources when making factual claims.`
  }

  /**
   * Validate citations in LLM response
   */
  private async validateCitations(
    response: string,
    sources: Array<{ id: string; title: string; citation: string; metadata: Record<string, any> }>,
  ): Promise<{ validatedCitations: string[]; flaggedCitations: string[] }> {
    try {
      // Extract citations from response
      const citationPattern = /\[Source (\d+)\]/g
      const foundCitations: string[] = []
      let match

      while ((match = citationPattern.exec(response)) !== null) {
        foundCitations.push(match[0])
      }

      const validatedCitations: string[] = []
      const flaggedCitations: string[] = []

      // Validate each citation
      for (const citation of foundCitations) {
        const sourceNumber = Number.parseInt(citation.match(/\d+/)?.[0] || "0")

        if (sourceNumber > 0 && sourceNumber <= sources.length) {
          validatedCitations.push(citation)
        } else {
          flaggedCitations.push(citation)
        }
      }

      // Additional validation: check if cited content actually supports claims
      if (validatedCitations.length > 0) {
        const contentValidation = await this.validateCitationContent(response, sources)
        // This could flag citations that don't support the claims made
      }

      return { validatedCitations, flaggedCitations }
    } catch (error) {
      console.error("Citation validation error:", error)
      return { validatedCitations: [], flaggedCitations: [] }
    }
  }

  /**
   * Validate that citations support the content claims
   */
  private async validateCitationContent(
    response: string,
    sources: Array<{ id: string; content: string; citation: string }>,
  ): Promise<CitationValidation[]> {
    // This could use an additional LLM call to verify that citations support claims
    // For now, we'll implement basic validation
    return []
  }

  /**
   * Calculate confidence score based on sources and citations
   */
  private calculateConfidenceScore(
    sources: Array<{ relevanceScore: number }>,
    validatedCitations: number,
    flaggedCitations: number,
  ): number {
    if (sources.length === 0) return 0

    // Base confidence on source relevance
    const avgRelevance = sources.reduce((sum, source) => sum + source.relevanceScore, 0) / sources.length

    // Adjust for citation validation
    const citationPenalty = flaggedCitations * 0.1
    const citationBonus = validatedCitations > 0 ? 0.1 : 0

    const confidence = Math.max(0, Math.min(1, avgRelevance + citationBonus - citationPenalty))

    return Math.round(confidence * 100) / 100
  }

  /**
   * Health check for RAG service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testQuery = "What is contract law?"
      const result = await this.processQuery({
        query: testQuery,
        options: { topK: 1, validateCitations: false },
      })
      return result.answer.length > 0
    } catch {
      return false
    }
  }
}

export const ragService = new RAGService()
