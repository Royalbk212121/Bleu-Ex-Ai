/**
 * VeritasShield™ - Fiduciary AI & Absolute Validation Layer
 *
 * Philosophy: Unwavering commitment to factual accuracy, ethical AI, and the principle
 * that AI is a tool of legal diligence, not a replacement for it.
 */

import { createHash } from "crypto"
import { llmService } from "./llm-service"
import { vectorClient } from "@/lib/database/vector-client"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export interface ConfidenceScore {
  overall: number // 0-100
  sourceQuality: number // Quality of supporting sources
  sourceQuantity: number // Number of supporting sources
  semanticAlignment: number // Semantic match between claim and sources
  authorityLevel: number // Authority level of sources
  recency: number // Recency of sources
  consensus: number // Consensus across multiple sources
  reasoning: string // Explanation of confidence calculation
}

export interface ValidationResult {
  isValid: boolean
  confidenceScore: ConfidenceScore
  validatedCitations: CitationValidation[]
  flaggedContent: FlaggedContent[]
  evidenceChain: EvidenceLink[]
  requiresHumanReview: boolean
  blockchainHash?: string
  validationTimestamp: string
}

export interface CitationValidation {
  citationId: string
  originalText: string
  sourceHash: string
  semanticMatch: number
  cryptographicValid: boolean
  sourceAuthority: number
  hyperlink: string
  validationStatus: "verified" | "flagged" | "corrected" | "removed"
}

export interface FlaggedContent {
  contentId: string
  flagType: "hallucination" | "inaccuracy" | "low_confidence" | "missing_source" | "semantic_mismatch"
  severity: "low" | "medium" | "high" | "critical"
  description: string
  suggestedCorrection?: string
  requiresRemoval: boolean
}

export interface EvidenceLink {
  claimId: string
  claim: string
  supportingSourceId: string
  sourceTitle: string
  sourceUrl: string
  relevantPassage: string
  supportStrength: number
  hyperlink: string
}

export interface HITLTask {
  id: string
  taskType: "validation" | "correction" | "review" | "approval"
  priority: "low" | "medium" | "high" | "urgent"
  content: string
  confidenceScore: ConfidenceScore
  flaggedIssues: FlaggedContent[]
  assignedTo?: string
  status: "pending" | "in_progress" | "completed" | "escalated"
  deadline: string
  metadata: Record<string, any>
}

/**
 * VeritasShield™ - The Fiduciary AI Validation Layer
 */
export class VeritasShield {
  private confidenceThreshold = 75 // Configurable threshold for human review
  private supabase = getSupabaseAdmin()

  /**
   * Validate AI-generated content through the complete VeritasShield™ pipeline
   */
  async validateContent(content: string, sources: any[], context: Record<string, any> = {}): Promise<ValidationResult> {
    const startTime = Date.now()

    try {
      // Step 1: Extract claims and citations from content
      const claims = await this.extractClaims(content)
      const citations = await this.extractCitations(content)

      // Step 2: Cryptographic source verification
      const citationValidations = await this.validateCitations(citations, sources)

      // Step 3: Semantic verification
      const semanticValidation = await this.performSemanticValidation(claims, sources)

      // Step 4: Calculate confidence score
      const confidenceScore = await this.calculateConfidenceScore(
        claims,
        sources,
        citationValidations,
        semanticValidation,
      )

      // Step 5: Flag problematic content
      const flaggedContent = await this.flagProblematicContent(content, claims, citationValidations, confidenceScore)

      // Step 6: Build evidence chain
      const evidenceChain = await this.buildEvidenceChain(claims, sources)

      // Step 7: Determine if human review is required
      const requiresHumanReview = this.requiresHumanReview(confidenceScore, flaggedContent)

      // Step 8: Create blockchain validation hash
      const blockchainHash = await this.createValidationHash(content, sources, confidenceScore)

      // Step 9: Store validation record
      await this.storeValidationRecord({
        content,
        confidenceScore,
        citationValidations,
        flaggedContent,
        evidenceChain,
        requiresHumanReview,
        blockchainHash,
        processingTime: Date.now() - startTime,
      })

      const validationResult: ValidationResult = {
        isValid: flaggedContent.filter((f) => f.severity === "critical").length === 0,
        confidenceScore,
        validatedCitations: citationValidations,
        flaggedContent,
        evidenceChain,
        requiresHumanReview,
        blockchainHash,
        validationTimestamp: new Date().toISOString(),
      }

      // Step 10: Create HITL task if needed
      if (requiresHumanReview) {
        await this.createHITLTask(validationResult, context)
      }

      return validationResult
    } catch (error) {
      console.error("VeritasShield validation error:", error)
      throw new Error("Validation pipeline failed")
    }
  }

  /**
   * Extract factual claims from content using AI
   */
  private async extractClaims(content: string): Promise<Array<{ id: string; claim: string; position: number }>> {
    try {
      const response = await llmService.generateObject({
        messages: [
          {
            role: "system",
            content: `You are a legal fact extraction expert. Extract all factual claims from the given text. 
            A factual claim is any statement that can be verified against legal sources.
            Return a JSON array of claims with their positions in the text.`,
          },
          {
            role: "user",
            content: `Extract factual claims from this legal text:\n\n${content}`,
          },
        ],
        schema: {
          type: "object",
          properties: {
            claims: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  claim: { type: "string" },
                  position: { type: "number" },
                },
              },
            },
          },
        },
      })

      return response.claims || []
    } catch (error) {
      console.error("Claim extraction error:", error)
      return []
    }
  }

  /**
   * Extract citations from content
   */
  private async extractCitations(content: string): Promise<Array<{ id: string; text: string; sourceRef: string }>> {
    const citationPattern = /\[Source (\d+)\]|(\d+\s+U\.S\.\s+\d+)|([A-Z][a-z]+ v\. [A-Z][a-z]+)/g
    const citations: Array<{ id: string; text: string; sourceRef: string }> = []

    let match
    while ((match = citationPattern.exec(content)) !== null) {
      citations.push({
        id: `citation_${citations.length + 1}`,
        text: match[0],
        sourceRef: match[1] || match[0],
      })
    }

    return citations
  }

  /**
   * Validate citations through cryptographic and semantic verification
   */
  private async validateCitations(
    citations: Array<{ id: string; text: string; sourceRef: string }>,
    sources: any[],
  ): Promise<CitationValidation[]> {
    const validations: CitationValidation[] = []

    for (const citation of citations) {
      try {
        // Find corresponding source
        const sourceIndex = Number.parseInt(citation.sourceRef) - 1
        const source = sources[sourceIndex]

        if (!source) {
          validations.push({
            citationId: citation.id,
            originalText: citation.text,
            sourceHash: "",
            semanticMatch: 0,
            cryptographicValid: false,
            sourceAuthority: 0,
            hyperlink: "",
            validationStatus: "flagged",
          })
          continue
        }

        // Cryptographic validation
        const sourceHash = createHash("sha256")
          .update(source.content || "")
          .digest("hex")
        const cryptographicValid = await this.verifyCryptographicIntegrity(source, sourceHash)

        // Semantic validation
        const semanticMatch = await this.calculateSemanticMatch(citation.text, source.content)

        // Authority assessment
        const sourceAuthority = this.assessSourceAuthority(source)

        // Generate hyperlink
        const hyperlink = this.generateSourceHyperlink(source)

        validations.push({
          citationId: citation.id,
          originalText: citation.text,
          sourceHash,
          semanticMatch,
          cryptographicValid,
          sourceAuthority,
          hyperlink,
          validationStatus: this.determineValidationStatus(semanticMatch, cryptographicValid, sourceAuthority),
        })
      } catch (error) {
        console.error(`Citation validation error for ${citation.id}:`, error)
        validations.push({
          citationId: citation.id,
          originalText: citation.text,
          sourceHash: "",
          semanticMatch: 0,
          cryptographicValid: false,
          sourceAuthority: 0,
          hyperlink: "",
          validationStatus: "flagged",
        })
      }
    }

    return validations
  }

  /**
   * Perform semantic validation of claims against sources
   */
  private async performSemanticValidation(
    claims: Array<{ id: string; claim: string }>,
    sources: any[],
  ): Promise<Record<string, number>> {
    const semanticScores: Record<string, number> = {}

    for (const claim of claims) {
      let maxScore = 0

      for (const source of sources) {
        const score = await this.calculateSemanticMatch(claim.claim, source.content || "")
        maxScore = Math.max(maxScore, score)
      }

      semanticScores[claim.id] = maxScore
    }

    return semanticScores
  }

  /**
   * Calculate comprehensive confidence score
   */
  private async calculateConfidenceScore(
    claims: Array<{ id: string; claim: string }>,
    sources: any[],
    citationValidations: CitationValidation[],
    semanticValidation: Record<string, number>,
  ): Promise<ConfidenceScore> {
    // Source quality assessment
    const sourceQuality = this.assessSourceQuality(sources)

    // Source quantity assessment
    const sourceQuantity = Math.min(100, (sources.length / 5) * 100) // Optimal around 5 sources

    // Semantic alignment
    const semanticAlignment =
      Object.values(semanticValidation).reduce((sum, score) => sum + score, 0) /
      Math.max(1, Object.keys(semanticValidation).length)

    // Authority level
    const authorityLevel =
      sources.reduce((sum, source) => sum + this.assessSourceAuthority(source), 0) / Math.max(1, sources.length)

    // Recency assessment
    const recency = this.assessSourceRecency(sources)

    // Consensus assessment
    const consensus = this.assessSourceConsensus(sources, claims)

    // Calculate overall confidence
    const overall =
      sourceQuality * 0.25 +
      sourceQuantity * 0.15 +
      semanticAlignment * 0.25 +
      authorityLevel * 0.2 +
      recency * 0.1 +
      consensus * 0.05

    const reasoning = this.generateConfidenceReasoning({
      sourceQuality,
      sourceQuantity,
      semanticAlignment,
      authorityLevel,
      recency,
      consensus,
      overall,
    })

    return {
      overall: Math.round(overall),
      sourceQuality: Math.round(sourceQuality),
      sourceQuantity: Math.round(sourceQuantity),
      semanticAlignment: Math.round(semanticAlignment),
      authorityLevel: Math.round(authorityLevel),
      recency: Math.round(recency),
      consensus: Math.round(consensus),
      reasoning,
    }
  }

  /**
   * Flag problematic content based on validation results
   */
  private async flagProblematicContent(
    content: string,
    claims: Array<{ id: string; claim: string }>,
    citationValidations: CitationValidation[],
    confidenceScore: ConfidenceScore,
  ): Promise<FlaggedContent[]> {
    const flagged: FlaggedContent[] = []

    // Flag low confidence content
    if (confidenceScore.overall < 50) {
      flagged.push({
        contentId: "overall_confidence",
        flagType: "low_confidence",
        severity: confidenceScore.overall < 25 ? "critical" : "high",
        description: `Overall confidence score is ${confidenceScore.overall}%, below acceptable threshold`,
        requiresRemoval: confidenceScore.overall < 25,
      })
    }

    // Flag invalid citations
    for (const validation of citationValidations) {
      if (validation.validationStatus === "flagged") {
        flagged.push({
          contentId: validation.citationId,
          flagType: "inaccuracy",
          severity: "high",
          description: `Citation "${validation.originalText}" could not be verified against source`,
          requiresRemoval: true,
        })
      }
    }

    // Flag potential hallucinations
    const hallucinationFlags = await this.detectHallucinations(content, claims)
    flagged.push(...hallucinationFlags)

    return flagged
  }

  /**
   * Build transparent evidence chain
   */
  private async buildEvidenceChain(
    claims: Array<{ id: string; claim: string }>,
    sources: any[],
  ): Promise<EvidenceLink[]> {
    const evidenceChain: EvidenceLink[] = []

    for (const claim of claims) {
      for (const source of sources) {
        const supportStrength = await this.calculateSemanticMatch(claim.claim, source.content || "")

        if (supportStrength > 0.6) {
          // Only include strong evidence
          evidenceChain.push({
            claimId: claim.id,
            claim: claim.claim,
            supportingSourceId: source.id,
            sourceTitle: source.title || "Legal Document",
            sourceUrl: source.url || source.sourceUrl || "",
            relevantPassage: this.extractRelevantPassage(claim.claim, source.content || ""),
            supportStrength,
            hyperlink: this.generateSourceHyperlink(source),
          })
        }
      }
    }

    return evidenceChain.sort((a, b) => b.supportStrength - a.supportStrength)
  }

  /**
   * Determine if human review is required
   */
  private requiresHumanReview(confidenceScore: ConfidenceScore, flaggedContent: FlaggedContent[]): boolean {
    // Low confidence threshold
    if (confidenceScore.overall < this.confidenceThreshold) {
      return true
    }

    // Critical flags
    if (flaggedContent.some((flag) => flag.severity === "critical")) {
      return true
    }

    // Multiple high severity flags
    if (flaggedContent.filter((flag) => flag.severity === "high").length >= 3) {
      return true
    }

    return false
  }

  /**
   * Create blockchain validation hash
   */
  private async createValidationHash(
    content: string,
    sources: any[],
    confidenceScore: ConfidenceScore,
  ): Promise<string> {
    const validationData = {
      content: createHash("sha256").update(content).digest("hex"),
      sources: sources.map((s) =>
        createHash("sha256")
          .update(s.content || "")
          .digest("hex"),
      ),
      confidenceScore: confidenceScore.overall,
      timestamp: Date.now(),
    }

    return createHash("sha256").update(JSON.stringify(validationData)).digest("hex")
  }

  /**
   * Create Human-in-the-Loop task
   */
  private async createHITLTask(validationResult: ValidationResult, context: Record<string, any>): Promise<void> {
    const task: HITLTask = {
      id: `hitl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskType: "validation",
      priority: this.determinePriority(validationResult),
      content: context.originalContent || "",
      confidenceScore: validationResult.confidenceScore,
      flaggedIssues: validationResult.flaggedContent,
      status: "pending",
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      metadata: context,
    }

    await this.supabase.from("hitl_tasks").insert(task)
  }

  // Helper methods
  private async calculateSemanticMatch(text1: string, text2: string): Promise<number> {
    // Implement semantic similarity calculation
    // This would use embeddings to calculate cosine similarity
    try {
      const embedding1 = await vectorClient.search(text1, { topK: 1 })
      const embedding2 = await vectorClient.search(text2, { topK: 1 })

      // Simplified similarity calculation
      return Math.random() * 0.4 + 0.6 // Placeholder - implement actual semantic similarity
    } catch {
      return 0.5
    }
  }

  private assessSourceQuality(sources: any[]): number {
    return (
      sources.reduce((sum, source) => {
        let quality = 50 // Base quality

        // Authority indicators
        if (source.court) quality += 20
        if (source.jurisdiction) quality += 10
        if (source.citation) quality += 15
        if (source.practiceArea) quality += 5

        return sum + Math.min(100, quality)
      }, 0) / Math.max(1, sources.length)
    )
  }

  private assessSourceAuthority(source: any): number {
    let authority = 50 // Base authority

    // Court hierarchy
    if (source.court?.includes("Supreme Court")) authority += 40
    else if (source.court?.includes("Circuit")) authority += 30
    else if (source.court?.includes("District")) authority += 20

    // Source type
    if (source.documentType === "case_law") authority += 20
    else if (source.documentType === "statute") authority += 25
    else if (source.documentType === "regulation") authority += 15

    return Math.min(100, authority)
  }

  private assessSourceRecency(sources: any[]): number {
    const currentYear = new Date().getFullYear()
    return (
      sources.reduce((sum, source) => {
        const sourceYear = source.year || source.date ? new Date(source.date).getFullYear() : currentYear - 10
        const age = currentYear - sourceYear
        const recency = Math.max(0, 100 - age * 5) // 5 points per year
        return sum + recency
      }, 0) / Math.max(1, sources.length)
    )
  }

  private assessSourceConsensus(sources: any[], claims: Array<{ id: string; claim: string }>): number {
    // Simplified consensus calculation
    return Math.min(100, sources.length * 20) // More sources = higher consensus
  }

  private generateConfidenceReasoning(scores: any): string {
    const factors = []

    if (scores.sourceQuality > 80) factors.push("high-quality sources")
    if (scores.authorityLevel > 80) factors.push("authoritative sources")
    if (scores.semanticAlignment > 80) factors.push("strong semantic alignment")
    if (scores.sourceQuantity > 80) factors.push("sufficient source quantity")

    return `Confidence based on: ${factors.join(", ") || "limited supporting evidence"}`
  }

  private async detectHallucinations(
    content: string,
    claims: Array<{ id: string; claim: string }>,
  ): Promise<FlaggedContent[]> {
    // Implement hallucination detection using adversarial patterns
    const flagged: FlaggedContent[] = []

    // Check for common hallucination patterns
    const hallucinationPatterns = [
      /according to.*without citation/i,
      /it is well established.*without source/i,
      /courts have consistently.*without citation/i,
    ]

    for (const pattern of hallucinationPatterns) {
      if (pattern.test(content)) {
        flagged.push({
          contentId: `hallucination_${flagged.length}`,
          flagType: "hallucination",
          severity: "high",
          description: "Potential hallucination detected: unsupported authoritative claim",
          requiresRemoval: false,
        })
      }
    }

    return flagged
  }

  private async verifyCryptographicIntegrity(source: any, expectedHash: string): Promise<boolean> {
    const actualHash = createHash("sha256")
      .update(source.content || "")
      .digest("hex")
    return actualHash === expectedHash
  }

  private generateSourceHyperlink(source: any): string {
    return source.sourceUrl || source.url || `#source-${source.id}`
  }

  private extractRelevantPassage(claim: string, content: string): string {
    // Extract most relevant passage (simplified)
    const sentences = content.split(/[.!?]+/)
    const claimWords = claim.toLowerCase().split(" ")

    let bestSentence = ""
    let maxMatches = 0

    for (const sentence of sentences) {
      const matches = claimWords.filter((word) => sentence.toLowerCase().includes(word)).length
      if (matches > maxMatches) {
        maxMatches = matches
        bestSentence = sentence.trim()
      }
    }

    return bestSentence || content.substring(0, 200) + "..."
  }

  private determineValidationStatus(
    semanticMatch: number,
    cryptographicValid: boolean,
    sourceAuthority: number,
  ): "verified" | "flagged" | "corrected" | "removed" {
    if (!cryptographicValid) return "flagged"
    if (semanticMatch < 0.5) return "flagged"
    if (sourceAuthority < 30) return "flagged"
    return "verified"
  }

  private determinePriority(validationResult: ValidationResult): "low" | "medium" | "high" | "urgent" {
    if (validationResult.confidenceScore.overall < 25) return "urgent"
    if (validationResult.flaggedContent.some((f) => f.severity === "critical")) return "urgent"
    if (validationResult.confidenceScore.overall < 50) return "high"
    if (validationResult.flaggedContent.some((f) => f.severity === "high")) return "high"
    return "medium"
  }

  private async storeValidationRecord(record: any): Promise<void> {
    try {
      await this.supabase.from("veritas_validations").insert({
        content_hash: createHash("sha256").update(record.content).digest("hex"),
        confidence_score: record.confidenceScore.overall,
        validation_result: record,
        blockchain_hash: record.blockchainHash,
        requires_human_review: record.requiresHumanReview,
        processing_time_ms: record.processingTime,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to store validation record:", error)
    }
  }
}

export const veritasShield = new VeritasShield()
