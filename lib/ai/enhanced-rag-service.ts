/**
 * Enhanced RAG Service with VeritasShield™ Integration
 * Grounded Generation with Absolute Validation
 */

import { ragService } from "./rag-service"
import { veritasShield, type ValidationResult } from "./veritas-shield"
import { citationValidationAgent } from "./citation-validation-agent"
import { hitlSystem } from "./hitl-system"
import { llmService } from "./llm-service"

export interface GroundedRAGRequest {
  query: string
  context?: Record<string, any>
  options?: {
    topK?: number
    model?: string
    temperature?: number
    confidenceThreshold?: number
    requireValidation?: boolean
    enableHITL?: boolean
    strictMode?: boolean
  }
}

export interface GroundedRAGResponse {
  answer: string
  sources: Array<{
    id: string
    title: string
    content: string
    citation: string
    hyperlink: string
    relevanceScore: number
    authorityScore: number
    validationStatus: "verified" | "flagged" | "pending"
  }>
  validation: ValidationResult
  confidenceScore: number
  evidenceChain: Array<{
    claim: string
    evidence: string
    sourceLink: string
    supportStrength: number
  }>
  requiresHumanReview: boolean
  hitlTaskId?: string
  processingTime: number
  blockchainHash?: string
}

/**
 * Enhanced RAG Service with VeritasShield™ Validation
 */
export class EnhancedRAGService {
  /**
   * Process query with full VeritasShield™ validation pipeline
   */
  async processGroundedQuery(request: GroundedRAGRequest): Promise<GroundedRAGResponse> {
    const startTime = Date.now()

    try {
      // Step 1: Retrieve and validate sources
      const sources = await this.retrieveAndValidateSources(request.query, request.options?.topK || 8)

      // Step 2: Generate grounded response
      const ragResponse = await ragService.processQuery({
        query: request.query,
        context: request.context,
        options: {
          ...request.options,
          validateCitations: true,
        },
      })

      // Step 3: Apply VeritasShield™ validation
      const validation = await veritasShield.validateContent(ragResponse.answer, sources, {
        originalQuery: request.query,
        ...request.context,
      })

      // Step 4: Validate citations with specialized agent
      const citationValidation = await citationValidationAgent.validateCitations(ragResponse.answer, sources, {
        strictMode: request.options?.strictMode || false,
        autoCorrect: true,
        requireCryptographicMatch: true,
      })

      // Step 5: Build enhanced evidence chain with hyperlinks
      const evidenceChain = await this.buildHyperlinkedEvidenceChain(
        ragResponse.answer,
        sources,
        validation.evidenceChain,
      )

      // Step 6: Determine if content meets confidence threshold
      const meetsThreshold = validation.confidenceScore.overall >= (request.options?.confidenceThreshold || 75)

      // Step 7: Create HITL task if needed
      let hitlTaskId: string | undefined
      if (validation.requiresHumanReview && request.options?.enableHITL !== false) {
        const hitlTask = await hitlSystem.createTask(validation, ragResponse.answer, {
          originalQuery: request.query,
          processingTime: Date.now() - startTime,
          ...request.context,
        })
        hitlTaskId = hitlTask.id
      }

      // Step 8: Apply corrections if validation failed
      let finalAnswer = ragResponse.answer
      if (!meetsThreshold || validation.flaggedContent.some((f) => f.requiresRemoval)) {
        finalAnswer = await this.applyCorrectionsPipeline(ragResponse.answer, validation, citationValidation, sources)
      }

      // Step 9: Enhance sources with validation data
      const enhancedSources = sources.map((source) => ({
        id: source.id,
        title: source.title,
        content: source.content,
        citation: source.citation,
        hyperlink: this.generateSecureHyperlink(source),
        relevanceScore: source.relevanceScore,
        authorityScore: this.calculateAuthorityScore(source),
        validationStatus: this.getSourceValidationStatus(source.id, validation),
      }))

      return {
        answer: finalAnswer,
        sources: enhancedSources,
        validation,
        confidenceScore: validation.confidenceScore.overall,
        evidenceChain,
        requiresHumanReview: validation.requiresHumanReview,
        hitlTaskId,
        processingTime: Date.now() - startTime,
        blockchainHash: validation.blockchainHash,
      }
    } catch (error) {
      console.error("Enhanced RAG processing error:", error)
      throw new Error("Grounded generation pipeline failed")
    }
  }

  /**
   * Stream grounded response with real-time validation
   */
  async *streamGroundedQuery(request: GroundedRAGRequest): AsyncGenerator<{
    type: "sources" | "chunk" | "validation" | "evidence" | "complete"
    data: any
  }> {
    try {
      // Retrieve and validate sources first
      const sources = await this.retrieveAndValidateSources(request.query, request.options?.topK || 8)

      yield {
        type: "sources",
        data: { sources },
      }

      // Stream RAG response
      const ragStream = ragService.streamQuery({
        query: request.query,
        context: request.context,
        options: request.options,
      })

      let fullResponse = ""
      for await (const chunk of ragStream) {
        if (chunk.type === "chunk") {
          fullResponse += chunk.data.chunk
          yield chunk
        } else {
          yield chunk
        }
      }

      // Validate complete response
      const validation = await veritasShield.validateContent(fullResponse, sources)

      yield {
        type: "validation",
        data: { validation },
      }

      // Build evidence chain
      const evidenceChain = await this.buildHyperlinkedEvidenceChain(fullResponse, sources, validation.evidenceChain)

      yield {
        type: "evidence",
        data: { evidenceChain },
      }

      // Complete with final validation
      yield {
        type: "complete",
        data: {
          confidenceScore: validation.confidenceScore.overall,
          requiresHumanReview: validation.requiresHumanReview,
          blockchainHash: validation.blockchainHash,
        },
      }
    } catch (error) {
      console.error("Enhanced RAG streaming error:", error)
      throw error
    }
  }

  /**
   * Retrieve sources with pre-validation
   */
  private async retrieveAndValidateSources(query: string, topK: number): Promise<any[]> {
    // Get sources from RAG service
    const ragResponse = await ragService.processQuery({
      query,
      options: { topK, validateCitations: false },
    })

    // Pre-validate source integrity
    const validatedSources = []
    for (const source of ragResponse.sources) {
      const isValid = await this.validateSourceIntegrity(source)
      if (isValid) {
        validatedSources.push(source)
      }
    }

    return validatedSources
  }

  /**
   * Validate source integrity before use
   */
  private async validateSourceIntegrity(source: any): Promise<boolean> {
    // Check for required fields
    if (!source.content || !source.title) {
      return false
    }

    // Check content quality
    if (source.content.length < 50) {
      return false
    }

    // Validate source authority
    const authorityScore = this.calculateAuthorityScore(source)
    if (authorityScore < 30) {
      return false
    }

    return true
  }

  /**
   * Build hyperlinked evidence chain
   */
  private async buildHyperlinkedEvidenceChain(
    answer: string,
    sources: any[],
    evidenceLinks: any[],
  ): Promise<
    Array<{
      claim: string
      evidence: string
      sourceLink: string
      supportStrength: number
    }>
  > {
    const enhancedChain = []

    for (const link of evidenceLinks) {
      const source = sources.find((s) => s.id === link.supportingSourceId)
      if (source) {
        enhancedChain.push({
          claim: link.claim,
          evidence: link.relevantPassage,
          sourceLink: this.generateSecureHyperlink(source),
          supportStrength: link.supportStrength,
        })
      }
    }

    return enhancedChain
  }

  /**
   * Apply corrections pipeline for flagged content
   */
  private async applyCorrectionsPipeline(
    originalAnswer: string,
    validation: ValidationResult,
    citationValidation: any,
    sources: any[],
  ): Promise<string> {
    let correctedAnswer = originalAnswer

    // Remove flagged content that requires removal
    for (const flag of validation.flaggedContent) {
      if (flag.requiresRemoval) {
        // Remove the problematic content
        correctedAnswer = correctedAnswer.replace(flag.description, "")
      }
    }

    // Apply citation corrections
    for (const citationCheck of citationValidation.checks) {
      if (citationCheck.correctedCitation && citationCheck.validationStatus === "invalid") {
        correctedAnswer = correctedAnswer.replace(citationCheck.originalCitation, citationCheck.correctedCitation)
      }
    }

    // Regenerate if too much content was removed
    if (correctedAnswer.length < originalAnswer.length * 0.5) {
      correctedAnswer = await this.regenerateContent(originalAnswer, validation, sources)
    }

    return correctedAnswer
  }

  /**
   * Regenerate content when too much was flagged
   */
  private async regenerateContent(
    originalAnswer: string,
    validation: ValidationResult,
    sources: any[],
  ): Promise<string> {
    const validSources = sources.filter(
      (source) => !validation.flaggedContent.some((flag) => flag.contentId.includes(source.id)),
    )

    if (validSources.length === 0) {
      return "I apologize, but I cannot provide a reliable answer based on the available sources. Please consult with a legal professional for accurate information."
    }

    // Regenerate with only valid sources
    const response = await llmService.generateText({
      messages: [
        {
          role: "system",
          content: `You are a legal research assistant. Provide accurate answers based ONLY on the provided valid sources. Use [Source X] citations for all claims.`,
        },
        {
          role: "user",
          content: `Based on these validated sources, please answer the query:\n\nSources:\n${validSources.map((s, i) => `[Source ${i + 1}] ${s.title}: ${s.content.substring(0, 500)}...`).join("\n\n")}\n\nQuery: ${validation.evidenceChain[0]?.claim || "Please provide information based on these sources."}`,
        },
      ],
      temperature: 0.1,
      maxTokens: 1500,
    })

    return response.text
  }

  /**
   * Generate secure hyperlink for source
   */
  private generateSecureHyperlink(source: any): string {
    if (source.sourceUrl) {
      return source.sourceUrl
    }

    if (source.url) {
      return source.url
    }

    // Generate internal link for stored documents
    return `/documents/${source.id}?verified=true&hash=${this.generateSourceHash(source)}`
  }

  /**
   * Calculate authority score for source
   */
  private calculateAuthorityScore(source: any): number {
    let score = 50 // Base score

    // Court hierarchy
    if (source.court) {
      if (source.court.includes("Supreme Court")) score += 40
      else if (source.court.includes("Circuit")) score += 30
      else if (source.court.includes("Appeals")) score += 25
      else if (source.court.includes("District")) score += 20
    }

    // Document type authority
    if (source.documentType) {
      switch (source.documentType) {
        case "case_law":
          score += 25
          break
        case "statute":
          score += 30
          break
        case "regulation":
          score += 20
          break
        case "secondary":
          score += 10
          break
      }
    }

    // Jurisdiction authority
    if (source.jurisdiction === "federal") score += 15
    else if (source.jurisdiction) score += 10

    // Citation quality
    if (source.citation) score += 10

    // Recency factor
    if (source.year || source.date) {
      const year = source.year || new Date(source.date).getFullYear()
      const currentYear = new Date().getFullYear()
      const age = currentYear - year
      if (age <= 5) score += 10
      else if (age <= 10) score += 5
      else if (age > 20) score -= 10
    }

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Get validation status for source
   */
  private getSourceValidationStatus(
    sourceId: string,
    validation: ValidationResult,
  ): "verified" | "flagged" | "pending" {
    const sourceValidation = validation.validatedCitations.find((v) => v.citationId.includes(sourceId))

    if (!sourceValidation) return "pending"

    return sourceValidation.validationStatus === "verified" ? "verified" : "flagged"
  }

  /**
   * Generate source hash for integrity
   */
  private generateSourceHash(source: any): string {
    const crypto = require("crypto")
    const sourceData = {
      content: source.content || "",
      title: source.title || "",
      citation: source.citation || "",
    }
    return crypto.createHash("sha256").update(JSON.stringify(sourceData)).digest("hex").substring(0, 16)
  }
}

export const enhancedRAGService = new EnhancedRAGService()
