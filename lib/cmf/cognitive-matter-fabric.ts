/**
 * Cognitive Matter Fabric™ (CMF) - The Living Brain of Every Case
 *
 * The singular, intelligent nexus for every legal matter that transcends traditional
 * document management, transforming disconnected files and tasks into a unified,
 * dynamic, and self-organizing knowledge entity.
 */

import { createClient } from "@supabase/supabase-js"
import { llmService } from "@/lib/ai/llm-service"
import { embeddingService } from "@/lib/ai/embedding-service"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface Matter {
  id: string
  name: string
  matterNumber: string
  client: string
  matterType: "litigation" | "transaction" | "advisory" | "compliance" | "regulatory"
  status: "active" | "closed" | "on_hold" | "archived"
  practiceArea: string
  jurisdiction: string
  assignedAttorneys: string[]
  leadAttorney: string
  budget: number
  billedAmount: number
  riskScore: number
  priority: "low" | "medium" | "high" | "critical"
  openDate: string
  targetCloseDate?: string
  actualCloseDate?: string
  description: string
  objectives: string[]
  keyIssues: string[]
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface MatterEntity {
  id: string
  matterId: string
  entityType: "person" | "organization" | "asset" | "location" | "concept" | "event" | "document"
  name: string
  description?: string
  properties: Record<string, any>
  coordinates?: { x: number; y: number; z?: number }
  importance: number
  firstMentioned: string
  lastUpdated: string
}

export interface MatterRelationship {
  id: string
  matterId: string
  sourceEntityId: string
  targetEntityId: string
  relationshipType: string
  strength: number
  confidence: number
  evidence: string[]
  temporal: {
    startDate?: string
    endDate?: string
    duration?: number
  }
  spatial?: {
    location?: string
    coordinates?: { lat: number; lng: number }
  }
  metadata: Record<string, any>
  createdAt: string
}

export interface MatterDocument {
  id: string
  matterId: string
  fileName: string
  fileType: string
  fileSize: number
  storageUrl: string
  version: number
  parentDocumentId?: string
  uploadedBy: string
  uploadedAt: string
  processedAt?: string
  ocrText?: string
  transcription?: string
  metadata: {
    parties: string[]
    dates: string[]
    legalIssues: string[]
    relevanceScore: number
    privilegeStatus: "privileged" | "not_privileged" | "work_product" | "under_review"
    riskLevel: "low" | "medium" | "high" | "critical"
    documentType: string
    jurisdiction: string
    tags: string[]
    extractedEntities: any[]
    sentiment?: {
      score: number
      label: "positive" | "negative" | "neutral"
    }
  }
  auditTrail: Array<{
    action: string
    userId: string
    timestamp: string
    changes: Record<string, any>
    ipAddress: string
    userAgent: string
  }>
}

export interface RiskAssessment {
  matterId: string
  overallScore: number
  lastUpdated: string
  categories: {
    legal: {
      score: number
      factors: Array<{
        factor: string
        impact: number
        likelihood: number
        description: string
      }>
    }
    financial: {
      score: number
      factors: Array<{
        factor: string
        impact: number
        likelihood: number
        description: string
      }>
    }
    reputational: {
      score: number
      factors: Array<{
        factor: string
        impact: number
        likelihood: number
        description: string
      }>
    }
    operational: {
      score: number
      factors: Array<{
        factor: string
        impact: number
        likelihood: number
        description: string
      }>
    }
  }
  trends: Array<{
    date: string
    score: number
    changedFactors: string[]
  }>
}

export interface PredictiveInsight {
  id: string
  matterId: string
  type: "deadline_alert" | "precedent_change" | "risk_escalation" | "opportunity" | "resource_optimization"
  priority: "low" | "medium" | "high" | "critical"
  title: string
  description: string
  confidence: number
  impact: "low" | "medium" | "high" | "critical"
  recommendedActions: string[]
  evidence: Array<{
    source: string
    relevance: number
    summary: string
  }>
  triggerConditions: Record<string, any>
  expiresAt?: string
  acknowledgedBy?: string
  acknowledgedAt?: string
  createdAt: string
}

/**
 * Cognitive Matter Fabric™ - Main orchestration class
 */
export class CognitiveMatterFabric {
  private matterContexts: Map<string, MatterContext> = new Map()

  /**
   * Initialize or retrieve a matter context
   */
  async getMatterContext(matterId: string): Promise<MatterContext> {
    if (!this.matterContexts.has(matterId)) {
      const context = new MatterContext(matterId)
      await context.initialize()
      this.matterContexts.set(matterId, context)
    }
    return this.matterContexts.get(matterId)!
  }

  /**
   * Create a new matter
   */
  async createMatter(matterData: Omit<Matter, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("matters")
        .insert({
          ...matterData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error) throw error

      const matterId = data.id

      // Initialize matter context
      const context = new MatterContext(matterId)
      await context.initialize()
      this.matterContexts.set(matterId, context)

      // Create initial knowledge graph
      await this.initializeMatterKnowledgeGraph(matterId, matterData)

      return matterId
    } catch (error) {
      console.error("Error creating matter:", error)
      throw error
    }
  }

  /**
   * Initialize knowledge graph for a new matter
   */
  private async initializeMatterKnowledgeGraph(matterId: string, matterData: any): Promise<void> {
    try {
      // Create initial entities
      const entities: Partial<MatterEntity>[] = [
        {
          matterId,
          entityType: "organization",
          name: matterData.client,
          description: "Client organization",
          properties: { role: "client" },
          importance: 1.0,
          firstMentioned: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        },
      ]

      // Add attorneys as entities
      for (const attorney of matterData.assignedAttorneys) {
        entities.push({
          matterId,
          entityType: "person",
          name: attorney,
          description: "Assigned attorney",
          properties: {
            role: attorney === matterData.leadAttorney ? "lead_attorney" : "attorney",
          },
          importance: attorney === matterData.leadAttorney ? 0.9 : 0.7,
          firstMentioned: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        })
      }

      // Add key issues as concept entities
      for (const issue of matterData.keyIssues || []) {
        entities.push({
          matterId,
          entityType: "concept",
          name: issue,
          description: "Key legal issue",
          properties: { category: "legal_issue" },
          importance: 0.8,
          firstMentioned: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        })
      }

      // Insert entities
      await supabase.from("matter_entities").insert(entities)

      // Create initial risk assessment
      await this.generateInitialRiskAssessment(matterId, matterData)
    } catch (error) {
      console.error("Error initializing matter knowledge graph:", error)
    }
  }

  /**
   * Generate initial risk assessment for a new matter
   */
  private async generateInitialRiskAssessment(matterId: string, matterData: any): Promise<void> {
    try {
      const prompt = `
        Analyze the following legal matter and provide an initial risk assessment:
        
        Matter Type: ${matterData.matterType}
        Practice Area: ${matterData.practiceArea}
        Jurisdiction: ${matterData.jurisdiction}
        Description: ${matterData.description}
        Key Issues: ${matterData.keyIssues?.join(", ") || "None specified"}
        
        Provide a JSON response with risk scores (0-100) and factors for:
        1. Legal risks
        2. Financial risks  
        3. Reputational risks
        4. Operational risks
        
        Format: {
          "legal": {"score": number, "factors": [{"factor": string, "impact": number, "likelihood": number, "description": string}]},
          "financial": {"score": number, "factors": [...]},
          "reputational": {"score": number, "factors": [...]},
          "operational": {"score": number, "factors": [...]}
        }
      `

      const response = await llmService.generateText({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      })

      try {
        const riskData = JSON.parse(response.text)
        const overallScore = Math.round(
          (riskData.legal.score + riskData.financial.score + riskData.reputational.score + riskData.operational.score) /
            4,
        )

        const riskAssessment: Partial<RiskAssessment> = {
          matterId,
          overallScore,
          lastUpdated: new Date().toISOString(),
          categories: riskData,
          trends: [
            {
              date: new Date().toISOString(),
              score: overallScore,
              changedFactors: ["Initial assessment"],
            },
          ],
        }

        await supabase.from("matter_risk_assessments").insert(riskAssessment)

        // Update matter with initial risk score
        await supabase.from("matters").update({ risk_score: overallScore }).eq("id", matterId)
      } catch (parseError) {
        console.error("Error parsing risk assessment:", parseError)
        // Fallback to default risk score
        await supabase.from("matters").update({ risk_score: 50 }).eq("id", matterId)
      }
    } catch (error) {
      console.error("Error generating initial risk assessment:", error)
    }
  }

  /**
   * Get all matters for a user
   */
  async getUserMatters(userId: string): Promise<Matter[]> {
    try {
      const { data, error } = await supabase
        .from("matters")
        .select("*")
        .contains("assigned_attorneys", [userId])
        .order("updated_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching user matters:", error)
      return []
    }
  }

  /**
   * Search matters using natural language
   */
  async searchMatters(query: string, userId?: string): Promise<Matter[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(query)

      // Search using vector similarity
      const { data, error } = await supabase.rpc("search_matters", {
        query_embedding: queryEmbedding,
        user_id: userId,
        match_threshold: 0.7,
        match_count: 20,
      })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error searching matters:", error)
      return []
    }
  }
}

/**
 * Matter Context - Persistent AI context for a specific matter
 */
export class MatterContext {
  private matterId: string
  private matter: Matter | null = null
  private entities: Map<string, MatterEntity> = new Map()
  private relationships: MatterRelationship[] = []
  private documents: Map<string, MatterDocument> = new Map()
  private riskAssessment: RiskAssessment | null = null
  private insights: PredictiveInsight[] = []

  constructor(matterId: string) {
    this.matterId = matterId
  }

  /**
   * Initialize the matter context
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.loadMatter(),
      this.loadEntities(),
      this.loadRelationships(),
      this.loadDocuments(),
      this.loadRiskAssessment(),
      this.loadInsights(),
    ])
  }

  /**
   * Load matter details
   */
  private async loadMatter(): Promise<void> {
    try {
      const { data, error } = await supabase.from("matters").select("*").eq("id", this.matterId).single()

      if (error) throw error
      this.matter = data
    } catch (error) {
      console.error("Error loading matter:", error)
    }
  }

  /**
   * Load matter entities
   */
  private async loadEntities(): Promise<void> {
    try {
      const { data, error } = await supabase.from("matter_entities").select("*").eq("matter_id", this.matterId)

      if (error) throw error

      this.entities.clear()
      data?.forEach((entity) => {
        this.entities.set(entity.id, entity)
      })
    } catch (error) {
      console.error("Error loading entities:", error)
    }
  }

  /**
   * Load matter relationships
   */
  private async loadRelationships(): Promise<void> {
    try {
      const { data, error } = await supabase.from("matter_relationships").select("*").eq("matter_id", this.matterId)

      if (error) throw error
      this.relationships = data || []
    } catch (error) {
      console.error("Error loading relationships:", error)
    }
  }

  /**
   * Load matter documents
   */
  private async loadDocuments(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("matter_documents")
        .select("*")
        .eq("matter_id", this.matterId)
        .order("uploaded_at", { ascending: false })

      if (error) throw error

      this.documents.clear()
      data?.forEach((doc) => {
        this.documents.set(doc.id, doc)
      })
    } catch (error) {
      console.error("Error loading documents:", error)
    }
  }

  /**
   * Load risk assessment
   */
  private async loadRiskAssessment(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("matter_risk_assessments")
        .select("*")
        .eq("matter_id", this.matterId)
        .order("last_updated", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") throw error
      this.riskAssessment = data
    } catch (error) {
      console.error("Error loading risk assessment:", error)
    }
  }

  /**
   * Load predictive insights
   */
  private async loadInsights(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("matter_insights")
        .select("*")
        .eq("matter_id", this.matterId)
        .is("acknowledged_at", null)
        .order("created_at", { ascending: false })

      if (error) throw error
      this.insights = data || []
    } catch (error) {
      console.error("Error loading insights:", error)
    }
  }

  /**
   * Add document to matter
   */
  async addDocument(documentData: Omit<MatterDocument, "id" | "uploadedAt" | "auditTrail">): Promise<string> {
    try {
      const docWithAudit = {
        ...documentData,
        uploaded_at: new Date().toISOString(),
        audit_trail: [
          {
            action: "document_uploaded",
            userId: documentData.uploadedBy,
            timestamp: new Date().toISOString(),
            changes: { status: "uploaded" },
            ipAddress: "unknown",
            userAgent: "unknown",
          },
        ],
      }

      const { data, error } = await supabase.from("matter_documents").insert(docWithAudit).select("id").single()

      if (error) throw error

      const documentId = data.id

      // Process document asynchronously
      this.processDocument(documentId, documentData)

      return documentId
    } catch (error) {
      console.error("Error adding document:", error)
      throw error
    }
  }

  /**
   * Process document for entity extraction and analysis
   */
  private async processDocument(documentId: string, documentData: any): Promise<void> {
    try {
      // Extract text content
      let textContent = ""
      if (documentData.ocrText) {
        textContent = documentData.ocrText
      } else if (documentData.transcription) {
        textContent = documentData.transcription
      }

      if (!textContent) return

      // Extract entities from document
      const entities = await this.extractEntitiesFromText(textContent)

      // Update document metadata
      const updatedMetadata = {
        ...documentData.metadata,
        extractedEntities: entities,
        processedAt: new Date().toISOString(),
      }

      await supabase
        .from("matter_documents")
        .update({
          metadata: updatedMetadata,
          processed_at: new Date().toISOString(),
        })
        .eq("id", documentId)

      // Add entities to knowledge graph
      await this.addEntitiesToGraph(entities, documentId)

      // Update risk assessment
      await this.updateRiskAssessment()

      // Generate insights
      await this.generateInsights()
    } catch (error) {
      console.error("Error processing document:", error)
    }
  }

  /**
   * Extract entities from text using AI
   */
  private async extractEntitiesFromText(text: string): Promise<any[]> {
    try {
      const prompt = `
        Extract all relevant entities from the following legal document text.
        For each entity, identify:
        1. Entity name
        2. Entity type (person, organization, location, date, amount, legal_concept, event)
        3. Context and role
        4. Importance (0-1)
        
        Text: ${text.substring(0, 10000)}
        
        Return JSON array of entities.
      `

      const response = await llmService.generateText({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      })

      try {
        return JSON.parse(response.text)
      } catch {
        return []
      }
    } catch (error) {
      console.error("Error extracting entities:", error)
      return []
    }
  }

  /**
   * Add entities to knowledge graph
   */
  private async addEntitiesToGraph(entities: any[], sourceDocumentId: string): Promise<void> {
    try {
      for (const entity of entities) {
        // Check if entity already exists
        const existingEntity = Array.from(this.entities.values()).find(
          (e) => e.name.toLowerCase() === entity.name.toLowerCase() && e.entityType === entity.type,
        )

        if (existingEntity) {
          // Update existing entity
          existingEntity.importance = Math.max(existingEntity.importance, entity.importance || 0.5)
          existingEntity.lastUpdated = new Date().toISOString()

          await supabase
            .from("matter_entities")
            .update({
              importance: existingEntity.importance,
              last_updated: existingEntity.lastUpdated,
            })
            .eq("id", existingEntity.id)
        } else {
          // Create new entity
          const newEntity: Partial<MatterEntity> = {
            matterId: this.matterId,
            entityType: entity.type,
            name: entity.name,
            description: entity.context,
            properties: { role: entity.role },
            importance: entity.importance || 0.5,
            firstMentioned: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          }

          const { data, error } = await supabase.from("matter_entities").insert(newEntity).select("*").single()

          if (!error && data) {
            this.entities.set(data.id, data)
          }
        }
      }
    } catch (error) {
      console.error("Error adding entities to graph:", error)
    }
  }

  /**
   * Update risk assessment based on new information
   */
  private async updateRiskAssessment(): Promise<void> {
    try {
      if (!this.matter) return

      const prompt = `
        Update the risk assessment for this legal matter based on new information:
        
        Matter: ${this.matter.name}
        Type: ${this.matter.matterType}
        Current Risk Score: ${this.riskAssessment?.overallScore || 50}
        
        Recent Documents: ${Array.from(this.documents.values())
          .slice(0, 5)
          .map((d) => d.fileName)
          .join(", ")}
        Key Entities: ${Array.from(this.entities.values())
          .slice(0, 10)
          .map((e) => e.name)
          .join(", ")}
        
        Provide updated risk scores and any new risk factors.
        Return JSON with same format as initial assessment.
      `

      const response = await llmService.generateText({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      })

      try {
        const riskData = JSON.parse(response.text)
        const overallScore = Math.round(
          (riskData.legal.score + riskData.financial.score + riskData.reputational.score + riskData.operational.score) /
            4,
        )

        // Update risk assessment
        const updatedAssessment = {
          ...this.riskAssessment,
          overallScore,
          lastUpdated: new Date().toISOString(),
          categories: riskData,
          trends: [
            ...(this.riskAssessment?.trends || []),
            {
              date: new Date().toISOString(),
              score: overallScore,
              changedFactors: ["Document analysis update"],
            },
          ],
        }

        await supabase.from("matter_risk_assessments").upsert(updatedAssessment)

        await supabase.from("matters").update({ risk_score: overallScore }).eq("id", this.matterId)

        this.riskAssessment = updatedAssessment as RiskAssessment
      } catch (parseError) {
        console.error("Error parsing updated risk assessment:", parseError)
      }
    } catch (error) {
      console.error("Error updating risk assessment:", error)
    }
  }

  /**
   * Generate predictive insights
   */
  private async generateInsights(): Promise<void> {
    try {
      if (!this.matter) return

      const prompt = `
        Analyze this legal matter and generate predictive insights and alerts:
        
        Matter: ${this.matter.name}
        Type: ${this.matter.matterType}
        Status: ${this.matter.status}
        Risk Score: ${this.riskAssessment?.overallScore || 50}
        
        Documents: ${this.documents.size} total
        Entities: ${this.entities.size} identified
        
        Generate insights for:
        1. Upcoming deadlines or critical dates
        2. Potential risks or opportunities
        3. Resource optimization suggestions
        4. Strategic recommendations
        
        Return JSON array of insights with type, priority, title, description, confidence, impact, and recommended actions.
      `

      const response = await llmService.generateText({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      })

      try {
        const insights = JSON.parse(response.text)

        for (const insight of insights) {
          const newInsight: Partial<PredictiveInsight> = {
            matterId: this.matterId,
            type: insight.type,
            priority: insight.priority,
            title: insight.title,
            description: insight.description,
            confidence: insight.confidence,
            impact: insight.impact,
            recommendedActions: insight.recommendedActions || [],
            evidence: insight.evidence || [],
            triggerConditions: insight.triggerConditions || {},
            createdAt: new Date().toISOString(),
          }

          await supabase.from("matter_insights").insert(newInsight)
        }

        // Reload insights
        await this.loadInsights()
      } catch (parseError) {
        console.error("Error parsing insights:", parseError)
      }
    } catch (error) {
      console.error("Error generating insights:", error)
    }
  }

  /**
   * Query the matter knowledge graph using natural language
   */
  async queryKnowledgeGraph(query: string): Promise<{
    entities: MatterEntity[]
    relationships: MatterRelationship[]
    summary: string
  }> {
    try {
      // Generate embedding for query
      const queryEmbedding = await embeddingService.generateEmbedding(query)

      // Search entities
      const { data: entityResults, error: entityError } = await supabase.rpc("search_matter_entities", {
        matter_id: this.matterId,
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 20,
      })

      if (entityError) throw entityError

      const relevantEntities = entityResults || []
      const entityIds = relevantEntities.map((e: any) => e.id)

      // Get relationships between relevant entities
      const { data: relationshipResults, error: relError } = await supabase
        .from("matter_relationships")
        .select("*")
        .eq("matter_id", this.matterId)
        .or(`source_entity_id.in.(${entityIds.join(",")}),target_entity_id.in.(${entityIds.join(",")})`)

      if (relError) throw relError

      // Generate summary using AI
      const summaryPrompt = `
        Based on the user query "${query}" and the following entities and relationships from a legal matter,
        provide a comprehensive summary:
        
        Entities: ${relevantEntities.map((e: any) => `${e.name} (${e.entity_type})`).join(", ")}
        Relationships: ${(relationshipResults || []).map((r: any) => r.relationship_type).join(", ")}
        
        Provide insights and connections relevant to the query.
      `

      const summaryResponse = await llmService.generateText({
        messages: [{ role: "user", content: summaryPrompt }],
        temperature: 0.2,
      })

      return {
        entities: relevantEntities,
        relationships: relationshipResults || [],
        summary: summaryResponse.text,
      }
    } catch (error) {
      console.error("Error querying knowledge graph:", error)
      return {
        entities: [],
        relationships: [],
        summary: "Error processing query",
      }
    }
  }

  /**
   * Get matter context for AI
   */
  getMatterContext(): string {
    if (!this.matter) return ""

    return `
      MATTER CONTEXT:
      Name: ${this.matter.name}
      Type: ${this.matter.matterType}
      Client: ${this.matter.client}
      Status: ${this.matter.status}
      Risk Score: ${this.matter.riskScore}/100
      
      Key Issues: ${this.matter.keyIssues?.join(", ") || "None"}
      Objectives: ${this.matter.objectives?.join(", ") || "None"}
      
      Documents: ${this.documents.size} total
      Entities: ${this.entities.size} identified
      Active Insights: ${this.insights.length}
      
      Recent Risk Factors: ${
        this.riskAssessment?.categories.legal.factors
          .slice(0, 3)
          .map((f) => f.factor)
          .join(", ") || "None"
      }
    `
  }

  // Getters
  getMatter(): Matter | null {
    return this.matter
  }
  getEntities(): MatterEntity[] {
    return Array.from(this.entities.values())
  }
  getRelationships(): MatterRelationship[] {
    return this.relationships
  }
  getDocuments(): MatterDocument[] {
    return Array.from(this.documents.values())
  }
  getRiskAssessment(): RiskAssessment | null {
    return this.riskAssessment
  }
  getInsights(): PredictiveInsight[] {
    return this.insights
  }
}

// Export singleton instance
export const cognitiveMatterFabric = new CognitiveMatterFabric()
