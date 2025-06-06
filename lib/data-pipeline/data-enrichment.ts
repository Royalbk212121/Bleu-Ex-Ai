/**
 * Data Enrichment Service
 * Handles enrichment of legal data with metadata, citations, and key terms
 */
import { postgresClient } from "@/lib/database/postgres-client"
import { mongoDBClient } from "@/lib/database/mongodb-client"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

interface EnrichmentResult {
  documentId: string
  summary: string
  keyTerms: string[]
  citations: string[]
  enrichedMetadata: Record<string, any>
}

/**
 * Data enrichment service
 */
export class DataEnrichmentService {
  /**
   * Enrich document with AI-generated metadata
   */
  async enrichDocument(documentId: string): Promise<EnrichmentResult> {
    try {
      // Get document metadata
      const documentMetadata = await postgresClient.getDocumentMetadata(documentId)
      if (!documentMetadata) {
        throw new Error(`Document not found: ${documentId}`)
      }

      // Get document content
      const documentContent = await mongoDBClient.getDocumentContent(documentId)
      if (!documentContent) {
        throw new Error(`Document content not found: ${documentId}`)
      }

      // Extract citations
      const citations = await this.extractCitations(documentContent.content)

      // Generate summary
      const summary = await this.generateSummary(documentContent.content, documentMetadata.title)

      // Extract key terms
      const keyTerms = await this.extractKeyTerms(documentContent.content, summary)

      // Update document metadata
      await postgresClient.updateDocumentMetadata(documentId, {
        summary,
        key_terms: keyTerms,
        citations,
        metadata: {
          ...documentMetadata.metadata,
          enriched: true,
          enrichmentDate: new Date().toISOString(),
        },
      })

      return {
        documentId,
        summary,
        keyTerms,
        citations,
        enrichedMetadata: {
          ...documentMetadata.metadata,
          enriched: true,
          enrichmentDate: new Date().toISOString(),
        },
      }
    } catch (error) {
      console.error("Error enriching document:", error)
      throw error
    }
  }

  /**
   * Extract citations from text
   */
  private async extractCitations(text: string): Promise<string[]> {
    try {
      // Use regex patterns to extract common legal citations
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

      // For more complex citations, use AI
      if (text.length > 1000) {
        const sampleText = text.substring(0, 10000) // Use first 10K chars for analysis
        const aiCitations = await this.extractCitationsWithAI(sampleText)
        citations.push(...aiCitations)
      }

      // Remove duplicates
      return [...new Set(citations)]
    } catch (error) {
      console.error("Error extracting citations:", error)
      return []
    }
  }

  /**
   * Extract citations using AI
   */
  private async extractCitationsWithAI(text: string): Promise<string[]> {
    try {
      const { text: result } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Extract all legal citations from the following text. Return ONLY a JSON array of strings with no explanation or other text:
        
        ${text.substring(0, 8000)}`,
        temperature: 0.1,
        maxTokens: 1000,
      })

      // Parse JSON array from response
      try {
        const jsonMatch = result.match(/\[.*\]/s)
        if (jsonMatch) {
          const citations = JSON.parse(jsonMatch[0])
          return Array.isArray(citations) ? citations : []
        }
      } catch (parseError) {
        console.error("Error parsing citations JSON:", parseError)
      }

      return []
    } catch (error) {
      console.error("Error extracting citations with AI:", error)
      return []
    }
  }

  /**
   * Generate summary of document
   */
  private async generateSummary(text: string, title: string): Promise<string> {
    try {
      // Use first 8000 chars for summary generation
      const sampleText = text.substring(0, 8000)

      const { text: summary } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Summarize the following legal document titled "${title}" in 3-4 paragraphs. Focus on the main legal points, arguments, and conclusions:
        
        ${sampleText}`,
        temperature: 0.3,
        maxTokens: 500,
      })

      return summary.trim()
    } catch (error) {
      console.error("Error generating summary:", error)
      return "Summary generation failed"
    }
  }

  /**
   * Extract key terms from document
   */
  private async extractKeyTerms(text: string, summary: string): Promise<string[]> {
    try {
      const { text: result } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Extract 10-15 key legal terms or concepts from this legal document. Return ONLY a JSON array of strings with no explanation:
        
        Summary: ${summary}
        
        Text sample: ${text.substring(0, 5000)}`,
        temperature: 0.2,
        maxTokens: 300,
      })

      // Parse JSON array from response
      try {
        const jsonMatch = result.match(/\[.*\]/s)
        if (jsonMatch) {
          const terms = JSON.parse(jsonMatch[0])
          return Array.isArray(terms) ? terms : []
        }
      } catch (parseError) {
        console.error("Error parsing key terms JSON:", parseError)
      }

      return []
    } catch (error) {
      console.error("Error extracting key terms:", error)
      return []
    }
  }
}

export const dataEnrichmentService = new DataEnrichmentService()
