/**
 * Citation Validation Agent
 * Performs cryptographic hash checks and semantic comparison of citations
 */

import { createHash } from "crypto"
import { llmService } from "./llm-service"
import { vectorClient } from "@/lib/database/vector-client"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export interface CitationCheck {
  citationId: string
  originalCitation: string
  sourceDocument: any
  cryptographicHash: string
  semanticSimilarity: number
  textualMatch: boolean
  authorityScore: number
  validationStatus: "valid" | "invalid" | "suspicious" | "corrected"
  correctedCitation?: string
  validationTimestamp: string
}

export interface ValidationReport {
  totalCitations: number
  validCitations: number
  invalidCitations: number
  suspiciousCitations: number
  correctedCitations: number
  overallAccuracy: number
  recommendations: string[]
}

/**
 * Citation Validation Agent for VeritasShield™
 */
export class CitationValidationAgent {
  private supabase = getSupabaseAdmin()

  /**
   * Validate all citations in a document against source materials
   */
  async validateCitations(
    content: string,
    sources: any[],
    options: {
      strictMode?: boolean
      autoCorrect?: boolean
      requireCryptographicMatch?: boolean
    } = {},
  ): Promise<{ checks: CitationCheck[]; report: ValidationReport }> {
    // Extract citations from content
    const citations = this.extractAllCitations(content)
    const checks: CitationCheck[] = []

    for (const citation of citations) {
      const check = await this.validateSingleCitation(citation, sources, options)
      checks.push(check)
    }

    const report = this.generateValidationReport(checks)

    // Store validation results
    await this.storeValidationResults(checks, report)

    return { checks, report }
  }

  /**
   * Validate a single citation against all available sources
   */
  private async validateSingleCitation(
    citation: { id: string; text: string; context: string },
    sources: any[],
    options: any,
  ): Promise<CitationCheck> {
    let bestMatch: any = null
    let highestSimilarity = 0
    let cryptographicHash = ""
    let textualMatch = false

    // Find the best matching source
    for (const source of sources) {
      const similarity = await this.calculateCitationSimilarity(citation, source)

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity
        bestMatch = source
      }
    }

    if (bestMatch) {
      // Perform cryptographic validation
      cryptographicHash = this.generateSourceHash(bestMatch)

      // Check for exact textual match
      textualMatch = await this.checkTextualMatch(citation, bestMatch)

      // Verify cryptographic integrity if required
      if (options.requireCryptographicMatch) {
        const integrityValid = await this.verifyCryptographicIntegrity(bestMatch, cryptographicHash)
        if (!integrityValid) {
          highestSimilarity = 0 // Fail validation if integrity check fails
        }
      }
    }

    const authorityScore = bestMatch ? this.calculateAuthorityScore(bestMatch) : 0
    const validationStatus = this.determineValidationStatus(
      highestSimilarity,
      textualMatch,
      authorityScore,
      options.strictMode,
    )

    // Auto-correct if enabled and needed
    let correctedCitation: string | undefined
    if (options.autoCorrect && validationStatus === "invalid" && bestMatch) {
      correctedCitation = await this.generateCorrectedCitation(citation, bestMatch)
    }

    return {
      citationId: citation.id,
      originalCitation: citation.text,
      sourceDocument: bestMatch,
      cryptographicHash,
      semanticSimilarity: highestSimilarity,
      textualMatch,
      authorityScore,
      validationStatus,
      correctedCitation,
      validationTimestamp: new Date().toISOString(),
    }
  }

  /**
   * Extract all citations from content using multiple patterns
   */
  private extractAllCitations(content: string): Array<{ id: string; text: string; context: string }> {
    const citations: Array<{ id: string; text: string; context: string }> = []

    // Legal citation patterns
    const patterns = [
      // U.S. Supreme Court
      /\d+\s+U\.S\.\s+\d+(?:\s+$$\d{4}$$)?/g,
      // Federal Reporter
      /\d+\s+F\.\d*d?\s+\d+(?:\s+$$[^)]+\s+\d{4}$$)?/g,
      // Case names
      /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+v\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g,
      // Source references
      /\[Source\s+\d+\]/g,
      // Statute citations
      /\d+\s+U\.S\.C\.\s+§?\s*\d+/g,
      // Code of Federal Regulations
      /\d+\s+C\.F\.R\.\s+§?\s*\d+/g,
    ]

    let citationId = 1
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const startPos = Math.max(0, match.index - 100)
        const endPos = Math.min(content.length, match.index + match[0].length + 100)
        const context = content.substring(startPos, endPos)

        citations.push({
          id: `citation_${citationId++}`,
          text: match[0],
          context,
        })
      }
    }

    return citations
  }

  /**
   * Calculate semantic similarity between citation and source
   */
  private async calculateCitationSimilarity(citation: { text: string; context: string }, source: any): Promise<number> {
    try {
      // Use vector search to find similarity
      const searchResults = await vectorClient.search(citation.context, { topK: 1 })

      if (searchResults.length > 0 && searchResults[0].metadata.documentId === source.id) {
        return searchResults[0].score
      }

      // Fallback: Use LLM for semantic comparison
      const response = await llmService.generateObject({
        messages: [
          {
            role: "system",
            content:
              "You are a legal citation validation expert. Compare the citation with the source content and return a similarity score from 0 to 1.",
          },
          {
            role: "user",
            content: `Citation: "${citation.text}"\nContext: "${citation.context}"\n\nSource Content: "${source.content?.substring(0, 1000) || ""}"\n\nReturn similarity score (0-1):`,
          },
        ],
        schema: {
          type: "object",
          properties: {
            similarity: { type: "number", minimum: 0, maximum: 1 },
            reasoning: { type: "string" },
          },
        },
      })

      return response.similarity || 0
    } catch (error) {
      console.error("Citation similarity calculation error:", error)
      return 0
    }
  }

  /**
   * Check for exact textual match
   */
  private async checkTextualMatch(citation: { text: string }, source: any): Promise<boolean> {
    const sourceContent = source.content || ""
    return sourceContent.includes(citation.text)
  }

  /**
   * Generate cryptographic hash for source integrity
   */
  private generateSourceHash(source: any): string {
    const sourceData = {
      content: source.content || "",
      title: source.title || "",
      citation: source.citation || "",
      url: source.url || "",
      timestamp: source.createdAt || source.timestamp || "",
    }

    return createHash("sha256").update(JSON.stringify(sourceData)).digest("hex")
  }

  /**
   * Verify cryptographic integrity of source
   */
  private async verifyCryptographicIntegrity(source: any, expectedHash: string): Promise<boolean> {
    const actualHash = this.generateSourceHash(source)
    return actualHash === expectedHash
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

    // Document type
    if (source.documentType) {
      if (source.documentType === "case_law") score += 25
      else if (source.documentType === "statute") score += 30
      else if (source.documentType === "regulation") score += 20
      else if (source.documentType === "secondary") score += 10
    }

    // Jurisdiction
    if (source.jurisdiction === "federal") score += 15
    else if (source.jurisdiction) score += 10

    // Recency
    if (source.year || source.date) {
      const year = source.year || new Date(source.date).getFullYear()
      const currentYear = new Date().getFullYear()
      const age = currentYear - year
      if (age <= 5) score += 10
      else if (age <= 10) score += 5
    }

    return Math.min(100, score)
  }

  /**
   * Determine validation status based on checks
   */
  private determineValidationStatus(
    similarity: number,
    textualMatch: boolean,
    authorityScore: number,
    strictMode?: boolean,
  ): "valid" | "invalid" | "suspicious" | "corrected" {
    const threshold = strictMode ? 0.8 : 0.6

    if (textualMatch && similarity >= threshold && authorityScore >= 70) {
      return "valid"
    } else if (similarity >= threshold && authorityScore >= 50) {
      return "valid"
    } else if (similarity >= 0.4 && authorityScore >= 30) {
      return "suspicious"
    } else {
      return "invalid"
    }
  }

  /**
   * Generate corrected citation using AI
   */
  private async generateCorrectedCitation(
    originalCitation: { text: string; context: string },
    source: any,
  ): Promise<string> {
    try {
      const response = await llmService.generateText({
        messages: [
          {
            role: "system",
            content:
              "You are a legal citation expert. Generate a properly formatted citation for the given source that matches legal citation standards.",
          },
          {
            role: "user",
            content: `Original citation: "${originalCitation.text}"\nSource: ${JSON.stringify(source, null, 2)}\n\nGenerate corrected citation:`,
          },
        ],
      })

      return response.text.trim()
    } catch (error) {
      console.error("Citation correction error:", error)
      return originalCitation.text
    }
  }

  /**
   * Generate validation report
   */
  private generateValidationReport(checks: CitationCheck[]): ValidationReport {
    const total = checks.length
    const valid = checks.filter((c) => c.validationStatus === "valid").length
    const invalid = checks.filter((c) => c.validationStatus === "invalid").length
    const suspicious = checks.filter((c) => c.validationStatus === "suspicious").length
    const corrected = checks.filter((c) => c.correctedCitation).length

    const accuracy = total > 0 ? (valid / total) * 100 : 0

    const recommendations: string[] = []

    if (accuracy < 70) {
      recommendations.push("Consider reviewing source materials for accuracy")
    }
    if (invalid > 0) {
      recommendations.push(`${invalid} citations require correction or removal`)
    }
    if (suspicious > 0) {
      recommendations.push(`${suspicious} citations need manual review`)
    }
    if (corrected > 0) {
      recommendations.push(`${corrected} citations have been auto-corrected`)
    }

    return {
      totalCitations: total,
      validCitations: valid,
      invalidCitations: invalid,
      suspiciousCitations: suspicious,
      correctedCitations: corrected,
      overallAccuracy: Math.round(accuracy),
      recommendations,
    }
  }

  /**
   * Store validation results in database
   */
  private async storeValidationResults(checks: CitationCheck[], report: ValidationReport): Promise<void> {
    try {
      // Store individual citation checks
      for (const check of checks) {
        await this.supabase.from("citation_validations").insert({
          citation_id: check.citationId,
          original_citation: check.originalCitation,
          validation_status: check.validationStatus,
          semantic_similarity: check.semanticSimilarity,
          textual_match: check.textualMatch,
          authority_score: check.authorityScore,
          cryptographic_hash: check.cryptographicHash,
          corrected_citation: check.correctedCitation,
          validation_timestamp: check.validationTimestamp,
        })
      }

      // Store validation report
      await this.supabase.from("citation_validation_reports").insert({
        total_citations: report.totalCitations,
        valid_citations: report.validCitations,
        invalid_citations: report.invalidCitations,
        suspicious_citations: report.suspiciousCitations,
        corrected_citations: report.correctedCitations,
        overall_accuracy: report.overallAccuracy,
        recommendations: report.recommendations,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to store validation results:", error)
    }
  }
}

export const citationValidationAgent = new CitationValidationAgent()
