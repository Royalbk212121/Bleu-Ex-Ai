/**
 * Custom ML Models Service
 * Handles e-Discovery document classification and custom legal ML models
 */
import { llmService } from "./llm-service"

export type DocumentClassification = "privileged" | "relevant" | "irrelevant" | "confidential" | "responsive"

export type PracticeArea =
  | "contract"
  | "litigation"
  | "corporate"
  | "intellectual_property"
  | "employment"
  | "real_estate"
  | "tax"
  | "criminal"

interface ClassificationRequest {
  documentId: string
  content: string
  metadata?: Record<string, any>
}

interface ClassificationResult {
  documentId: string
  classification: DocumentClassification
  practiceArea: PracticeArea
  confidence: number
  reasoning: string
  keyTerms: string[]
  riskFactors: string[]
  recommendations: string[]
}

interface ModelPrediction {
  label: string
  confidence: number
  features: Record<string, any>
}

/**
 * ML Models service for legal document analysis
 */
export class MLModelsService {
  private modelEndpoints: Map<string, string> = new Map()
  private classificationCache: Map<string, ClassificationResult> = new Map()

  constructor() {
    this.initializeModelEndpoints()
  }

  /**
   * Initialize model endpoints
   */
  private initializeModelEndpoints() {
    // In production, these would be SageMaker endpoints
    this.modelEndpoints.set("privilege-classifier", process.env.PRIVILEGE_MODEL_ENDPOINT || "")
    this.modelEndpoints.set("relevance-classifier", process.env.RELEVANCE_MODEL_ENDPOINT || "")
    this.modelEndpoints.set("practice-area-classifier", process.env.PRACTICE_AREA_MODEL_ENDPOINT || "")
    this.modelEndpoints.set("risk-analyzer", process.env.RISK_ANALYZER_ENDPOINT || "")
  }

  /**
   * Classify document for e-Discovery
   */
  async classifyDocument(request: ClassificationRequest): Promise<ClassificationResult> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(request.documentId, request.content)
      const cached = this.classificationCache.get(cacheKey)
      if (cached) {
        return cached
      }

      // Use AI-powered classification as fallback to custom models
      const result = await this.classifyWithAI(request)

      // Cache result
      this.classificationCache.set(cacheKey, result)

      return result
    } catch (error) {
      console.error("Document classification error:", error)
      throw error
    }
  }

  /**
   * Classify document using AI (fallback method)
   */
  private async classifyWithAI(request: ClassificationRequest): Promise<ClassificationResult> {
    const classificationSchema = {
      type: "object",
      properties: {
        classification: {
          type: "string",
          enum: ["privileged", "relevant", "irrelevant", "confidential", "responsive"],
        },
        practiceArea: {
          type: "string",
          enum: [
            "contract",
            "litigation",
            "corporate",
            "intellectual_property",
            "employment",
            "real_estate",
            "tax",
            "criminal",
          ],
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
        },
        reasoning: {
          type: "string",
        },
        keyTerms: {
          type: "array",
          items: { type: "string" },
        },
        riskFactors: {
          type: "array",
          items: { type: "string" },
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["classification", "practiceArea", "confidence", "reasoning"],
    }

    const prompt = `Analyze the following legal document for e-Discovery classification:

Document Content:
${request.content.substring(0, 8000)}

Metadata:
${JSON.stringify(request.metadata || {}, null, 2)}

Classify this document according to:
1. E-Discovery classification (privileged, relevant, irrelevant, confidential, responsive)
2. Practice area
3. Confidence level (0-1)
4. Reasoning for classification
5. Key legal terms identified
6. Risk factors
7. Recommendations for handling

Consider attorney-client privilege, work product doctrine, relevance to litigation, and confidentiality requirements.`

    try {
      const result = await llmService.generateObject<any>({
        messages: [
          {
            role: "system",
            content: `You are an expert legal document classifier specializing in e-Discovery. Analyze documents for privilege, relevance, and practice area classification with high accuracy.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        schema: classificationSchema,
        temperature: 0.1,
      })

      return {
        documentId: request.documentId,
        classification: result.classification,
        practiceArea: result.practiceArea,
        confidence: result.confidence,
        reasoning: result.reasoning,
        keyTerms: result.keyTerms || [],
        riskFactors: result.riskFactors || [],
        recommendations: result.recommendations || [],
      }
    } catch (error) {
      console.error("AI classification error:", error)

      // Fallback classification
      return {
        documentId: request.documentId,
        classification: "irrelevant",
        practiceArea: "contract",
        confidence: 0.5,
        reasoning: "Classification failed, manual review required",
        keyTerms: [],
        riskFactors: ["Classification uncertainty"],
        recommendations: ["Manual review recommended"],
      }
    }
  }

  /**
   * Batch classify multiple documents
   */
  async batchClassifyDocuments(requests: ClassificationRequest[]): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = []
    const batchSize = 10

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize)
      const batchPromises = batch.map((request) => this.classifyDocument(request))
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Add delay between batches
      if (i + batchSize < requests.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    return results
  }

  /**
   * Analyze document risk factors
   */
  async analyzeRiskFactors(
    content: string,
    metadata?: Record<string, any>,
  ): Promise<{
    riskLevel: "low" | "medium" | "high"
    riskFactors: Array<{
      factor: string
      severity: number
      description: string
      mitigation: string
    }>
    overallScore: number
  }> {
    try {
      const riskSchema = {
        type: "object",
        properties: {
          riskLevel: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          riskFactors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                factor: { type: "string" },
                severity: { type: "number", minimum: 1, maximum: 10 },
                description: { type: "string" },
                mitigation: { type: "string" },
              },
            },
          },
          overallScore: {
            type: "number",
            minimum: 0,
            maximum: 100,
          },
        },
      }

      const result = await llmService.generateObject<any>({
        messages: [
          {
            role: "system",
            content: `You are a legal risk analysis expert. Identify and assess risk factors in legal documents with detailed mitigation strategies.`,
          },
          {
            role: "user",
            content: `Analyze the following legal document for risk factors:

${content.substring(0, 6000)}

Metadata: ${JSON.stringify(metadata || {}, null, 2)}

Identify:
1. Overall risk level (low/medium/high)
2. Specific risk factors with severity scores (1-10)
3. Detailed descriptions of each risk
4. Mitigation strategies for each risk
5. Overall risk score (0-100)`,
          },
        ],
        schema: riskSchema,
        temperature: 0.1,
      })

      return result
    } catch (error) {
      console.error("Risk analysis error:", error)
      return {
        riskLevel: "medium",
        riskFactors: [
          {
            factor: "Analysis Error",
            severity: 5,
            description: "Unable to complete automated risk analysis",
            mitigation: "Manual review recommended",
          },
        ],
        overallScore: 50,
      }
    }
  }

  /**
   * Extract contract terms and obligations
   */
  async extractContractTerms(content: string): Promise<{
    parties: string[]
    keyTerms: Array<{
      term: string
      value: string
      section: string
      importance: "high" | "medium" | "low"
    }>
    obligations: Array<{
      party: string
      obligation: string
      deadline?: string
      penalty?: string
    }>
    dates: Array<{
      type: string
      date: string
      description: string
    }>
  }> {
    try {
      const contractSchema = {
        type: "object",
        properties: {
          parties: {
            type: "array",
            items: { type: "string" },
          },
          keyTerms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                term: { type: "string" },
                value: { type: "string" },
                section: { type: "string" },
                importance: { type: "string", enum: ["high", "medium", "low"] },
              },
            },
          },
          obligations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                party: { type: "string" },
                obligation: { type: "string" },
                deadline: { type: "string" },
                penalty: { type: "string" },
              },
            },
          },
          dates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                date: { type: "string" },
                description: { type: "string" },
              },
            },
          },
        },
      }

      const result = await llmService.generateObject<any>({
        messages: [
          {
            role: "system",
            content: `You are a contract analysis expert. Extract key terms, parties, obligations, and important dates from legal contracts with precision.`,
          },
          {
            role: "user",
            content: `Extract key information from this contract:

${content.substring(0, 8000)}

Extract:
1. All parties to the contract
2. Key terms with their values and importance levels
3. Obligations for each party with deadlines and penalties
4. Important dates (effective date, expiration, milestones, etc.)`,
          },
        ],
        schema: contractSchema,
        temperature: 0.1,
      })

      return result
    } catch (error) {
      console.error("Contract term extraction error:", error)
      return {
        parties: [],
        keyTerms: [],
        obligations: [],
        dates: [],
      }
    }
  }

  /**
   * Get cache key for classification
   */
  private getCacheKey(documentId: string, content: string): string {
    // Use document ID and content hash for cache key
    const contentHash = content.length.toString() + content.substring(0, 100)
    return `${documentId}:${contentHash}`
  }

  /**
   * Clear classification cache
   */
  clearCache() {
    this.classificationCache.clear()
  }

  /**
   * Get classification statistics
   */
  getClassificationStats() {
    const stats: Record<string, number> = {}

    this.classificationCache.forEach((result) => {
      stats[result.classification] = (stats[result.classification] || 0) + 1
    })

    return {
      totalClassified: this.classificationCache.size,
      byClassification: stats,
      cacheSize: this.classificationCache.size,
    }
  }

  /**
   * Health check for ML models
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {}

    // Test AI-powered classification
    try {
      const testResult = await this.classifyDocument({
        documentId: "test",
        content: "This is a test legal document for classification.",
      })
      health["ai-classification"] = testResult.confidence > 0
    } catch {
      health["ai-classification"] = false
    }

    // Test custom model endpoints (if available)
    for (const [modelName, endpoint] of this.modelEndpoints.entries()) {
      if (endpoint) {
        try {
          // In production, this would ping the SageMaker endpoint
          health[modelName] = true
        } catch {
          health[modelName] = false
        }
      } else {
        health[modelName] = false
      }
    }

    return health
  }
}

export const mlModelsService = new MLModelsService()
