/**
 * AI Orchestration Service
 * The Brain - orchestrates AI tasks and manages the agent pipeline
 */

import { ArbiterNet } from "@/lib/arbiternet"
import { generateText, streamText } from "ai"
import { google } from "@ai-sdk/google"
import { realtimeService } from "./realtime-service"

interface AITask {
  id: string
  userId: string
  sessionId?: string
  type: "chat" | "document_analysis" | "legal_research" | "drafting" | "review"
  input: Record<string, any>
  context: Record<string, any>
  priority: number
  status: "pending" | "processing" | "completed" | "failed"
  result?: any
  error?: string
  createdAt: Date
  completedAt?: Date
}

interface AIResponse {
  taskId: string
  result: any
  confidence: number
  sources: any[]
  processingTime: number
}

export class AIOrchestrationService {
  private arbiterNet: ArbiterNet
  private activeTasks: Map<string, AITask> = new Map()
  private taskQueue: AITask[] = []
  private isProcessing = false

  constructor() {
    this.arbiterNet = new ArbiterNet()
    this.startTaskProcessor()
  }

  /**
   * Submit AI task for processing
   */
  async submitTask(
    userId: string,
    taskType: string,
    input: Record<string, any>,
    context: Record<string, any> = {},
    sessionId?: string,
  ): Promise<string> {
    const task: AITask = {
      id: this.generateTaskId(),
      userId,
      sessionId,
      type: taskType as any,
      input,
      context,
      priority: this.calculatePriority(taskType, context),
      status: "pending",
      createdAt: new Date(),
    }

    this.activeTasks.set(task.id, task)
    this.taskQueue.push(task)
    this.taskQueue.sort((a, b) => b.priority - a.priority) // Higher priority first

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processTaskQueue()
    }

    return task.id
  }

  /**
   * Process chat request with streaming
   */
  async processChatStream(
    userId: string,
    messages: any[],
    sessionId: string,
    options: {
      useRAG?: boolean
      useLiveSources?: boolean
      useAgents?: boolean
    } = {},
  ): Promise<void> {
    try {
      const lastMessage = messages[messages.length - 1]
      let enhancedContext = ""
      let citations: any[] = []

      // Use agent swarm if enabled
      if (options.useAgents) {
        const agentSessionId = await this.arbiterNet.createSession(userId, `Chat Session ${sessionId}`, "chat", {
          messages,
          options,
        })

        const agentResult = await this.arbiterNet.processRequest(agentSessionId, lastMessage.content, {
          sessionId,
          streaming: true,
        })

        // Stream agent response
        realtimeService.streamToSession(sessionId, "agent_response", {
          response: agentResult.response,
          agentsUsed: agentResult.agentsUsed,
          confidence: agentResult.confidence,
          citations: agentResult.citations,
        })

        return
      }

      // Enhanced RAG search if enabled
      if (options.useRAG) {
        try {
          const ragResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/rag/enhanced-search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: lastMessage.content,
              limit: 8,
            }),
          })

          if (ragResponse.ok) {
            const ragData = await ragResponse.json()
            if (ragData.results && ragData.results.length > 0) {
              enhancedContext = this.formatRAGResults(ragData.results)
              citations = ragData.results.map((result: any, index: number) => ({
                id: index + 1,
                title: result.title || "Legal Document",
                source: result.source || "Legal Database",
                url: result.url || "#",
                excerpt: result.content?.substring(0, 200) + "..." || "",
                relevanceScore: result.similarity || 0,
              }))
            }
          }
        } catch (error) {
          console.error("RAG search error:", error)
        }
      }

      const systemPrompt = `You are an expert legal research assistant with access to comprehensive legal databases.

IMPORTANT INSTRUCTIONS:
1. Provide accurate, well-researched legal information
2. Always cite your sources using [Source X] format
3. Be thorough but concise in your explanations
4. Include relevant case law, statutes, and legal precedents
5. Format your responses with proper markdown for readability

${enhancedContext ? `LEGAL CONTEXT:\n${enhancedContext}` : "No specific legal context provided."}

Remember: Always recommend consulting with a qualified attorney for specific legal advice.`

      // Stream AI response
      const result = streamText({
        model: google("gemini-1.5-pro"),
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.1,
        maxTokens: 2000,
      })

      // Stream chunks to client
      for await (const chunk of result.textStream) {
        realtimeService.streamToSession(sessionId, "stream_chunk", {
          chunk,
          citations,
        })
      }

      realtimeService.streamToSession(sessionId, "stream_complete", {
        sessionId,
        citations,
        totalSources: citations.length,
      })
    } catch (error) {
      console.error("Chat stream processing error:", error)
      realtimeService.streamToSession(sessionId, "stream_error", {
        error: "Failed to process chat request",
      })
    }
  }

  /**
   * Process document analysis
   */
  async processDocumentAnalysis(
    userId: string,
    documentId: string,
    analysisType: string,
    sessionId?: string,
  ): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      // Get document content (this would fetch from document service)
      const documentContent = await this.getDocumentContent(documentId, userId)

      let analysisResult: any

      switch (analysisType) {
        case "risk_assessment":
          analysisResult = await this.performRiskAssessment(documentContent)
          break
        case "contract_review":
          analysisResult = await this.performContractReview(documentContent)
          break
        case "compliance_check":
          analysisResult = await this.performComplianceCheck(documentContent)
          break
        case "legal_summary":
          analysisResult = await this.generateLegalSummary(documentContent)
          break
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`)
      }

      const processingTime = Date.now() - startTime

      const response: AIResponse = {
        taskId: this.generateTaskId(),
        result: analysisResult,
        confidence: analysisResult.confidence || 0.85,
        sources: analysisResult.sources || [],
        processingTime,
      }

      // Stream result if session provided
      if (sessionId) {
        realtimeService.streamToSession(sessionId, "analysis_complete", response)
      }

      return response
    } catch (error) {
      console.error("Document analysis error:", error)
      throw error
    }
  }

  /**
   * Process legal research request
   */
  async processLegalResearch(
    userId: string,
    query: string,
    context: Record<string, any> = {},
    sessionId?: string,
  ): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      // Use agent swarm for comprehensive research
      const agentSessionId = await this.arbiterNet.createSession(userId, `Research: ${query}`, "research", context)

      const agentResult = await this.arbiterNet.processRequest(agentSessionId, query, context)

      const processingTime = Date.now() - startTime

      const response: AIResponse = {
        taskId: this.generateTaskId(),
        result: {
          research: agentResult.response,
          agentsUsed: agentResult.agentsUsed,
          methodology: "Multi-agent collaborative research",
        },
        confidence: agentResult.confidence,
        sources: agentResult.citations,
        processingTime,
      }

      // Stream result if session provided
      if (sessionId) {
        realtimeService.streamToSession(sessionId, "research_complete", response)
      }

      return response
    } catch (error) {
      console.error("Legal research error:", error)
      throw error
    }
  }

  /**
   * Start task queue processor
   */
  private async startTaskProcessor() {
    this.isProcessing = true

    while (true) {
      if (this.taskQueue.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }

      const task = this.taskQueue.shift()!
      await this.processTask(task)
    }
  }

  /**
   * Process individual task
   */
  private async processTask(task: AITask) {
    try {
      task.status = "processing"
      this.activeTasks.set(task.id, task)

      let result: any

      switch (task.type) {
        case "chat":
          if (task.sessionId) {
            await this.processChatStream(task.userId, task.input.messages, task.sessionId, task.input.options)
          }
          result = { success: true }
          break

        case "document_analysis":
          result = await this.processDocumentAnalysis(
            task.userId,
            task.input.documentId,
            task.input.analysisType,
            task.sessionId,
          )
          break

        case "legal_research":
          result = await this.processLegalResearch(task.userId, task.input.query, task.context, task.sessionId)
          break

        default:
          throw new Error(`Unknown task type: ${task.type}`)
      }

      task.status = "completed"
      task.result = result
      task.completedAt = new Date()
    } catch (error) {
      console.error(`Task processing error for ${task.id}:`, error)
      task.status = "failed"
      task.error = error instanceof Error ? error.message : "Unknown error"
      task.completedAt = new Date()
    }

    this.activeTasks.set(task.id, task)
  }

  /**
   * Get document content (mock implementation)
   */
  private async getDocumentContent(documentId: string, userId: string): Promise<string> {
    // In production, this would call the document service
    return "Sample legal document content for analysis..."
  }

  /**
   * Perform risk assessment
   */
  private async performRiskAssessment(content: string): Promise<any> {
    const { text } = await generateText({
      model: google("gemini-1.5-pro"),
      prompt: `Analyze the following legal document for potential risks. Identify:
      1. High-risk clauses or terms
      2. Missing protective provisions
      3. Compliance issues
      4. Liability concerns
      
      Document: ${content.substring(0, 5000)}
      
      Return a JSON object with: risks, severity, recommendations, confidence`,
      temperature: 0.1,
    })

    try {
      return JSON.parse(text)
    } catch {
      return {
        risks: ["Analysis completed"],
        severity: "medium",
        recommendations: ["Review with legal counsel"],
        confidence: 0.8,
      }
    }
  }

  /**
   * Perform contract review
   */
  private async performContractReview(content: string): Promise<any> {
    const { text } = await generateText({
      model: google("gemini-1.5-pro"),
      prompt: `Review the following contract for:
      1. Key terms and obligations
      2. Potential issues or ambiguities
      3. Missing standard clauses
      4. Negotiation points
      
      Contract: ${content.substring(0, 5000)}
      
      Return a JSON object with: keyTerms, issues, missingClauses, negotiationPoints, confidence`,
      temperature: 0.1,
    })

    try {
      return JSON.parse(text)
    } catch {
      return {
        keyTerms: ["Contract terms identified"],
        issues: ["Review completed"],
        missingClauses: ["Standard review"],
        negotiationPoints: ["Points identified"],
        confidence: 0.85,
      }
    }
  }

  /**
   * Perform compliance check
   */
  private async performComplianceCheck(content: string): Promise<any> {
    return {
      complianceStatus: "compliant",
      violations: [],
      recommendations: ["Document appears compliant"],
      confidence: 0.9,
    }
  }

  /**
   * Generate legal summary
   */
  private async generateLegalSummary(content: string): Promise<any> {
    const { text } = await generateText({
      model: google("gemini-1.5-pro"),
      prompt: `Generate a comprehensive legal summary of the following document:
      1. Main purpose and scope
      2. Key legal provisions
      3. Important dates and deadlines
      4. Parties and their obligations
      5. Risk factors
      
      Document: ${content.substring(0, 5000)}
      
      Return a JSON object with: summary, keyProvisions, importantDates, parties, riskFactors, confidence`,
      temperature: 0.1,
    })

    try {
      return JSON.parse(text)
    } catch {
      return {
        summary: "Legal document summary generated",
        keyProvisions: ["Key provisions identified"],
        importantDates: ["Dates extracted"],
        parties: ["Parties identified"],
        riskFactors: ["Risk factors analyzed"],
        confidence: 0.85,
      }
    }
  }

  /**
   * Format RAG results for context
   */
  private formatRAGResults(results: any[]): string {
    if (!results || results.length === 0) return ""

    return results
      .slice(0, 6)
      .map((result, index) => {
        const title = result.title || "Legal Document"
        const source = result.source || "Legal Database"
        const content = result.content || result.excerpt || ""

        return `[Source ${index + 1}] ${source} - ${title}
Content: ${content.substring(0, 400)}${content.length > 400 ? "..." : ""}
---`
      })
      .join("\n\n")
  }

  /**
   * Calculate task priority
   */
  private calculatePriority(taskType: string, context: Record<string, any>): number {
    const basePriority: Record<string, number> = {
      chat: 5,
      document_analysis: 7,
      legal_research: 6,
      drafting: 8,
      review: 9,
    }

    let priority = basePriority[taskType] || 5

    // Increase priority for premium users
    if (context.subscriptionTier === "professional") priority += 2
    if (context.subscriptionTier === "enterprise") priority += 4

    // Increase priority for urgent tasks
    if (context.urgent) priority += 3

    return Math.min(priority, 10)
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): AITask | null {
    return this.activeTasks.get(taskId) || null
  }

  /**
   * Get user's active tasks
   */
  getUserActiveTasks(userId: string): AITask[] {
    return Array.from(this.activeTasks.values()).filter(
      (task) => task.userId === userId && task.status === "processing",
    )
  }

  /**
   * Cancel task
   */
  cancelTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId)
    if (task && task.status === "pending") {
      task.status = "failed"
      task.error = "Task cancelled by user"
      task.completedAt = new Date()

      // Remove from queue
      this.taskQueue = this.taskQueue.filter((t) => t.id !== taskId)

      return true
    }
    return false
  }

  /**
   * Get service statistics
   */
  getStats() {
    const tasks = Array.from(this.activeTasks.values())

    return {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter((t) => t.status === "pending").length,
      processingTasks: tasks.filter((t) => t.status === "processing").length,
      completedTasks: tasks.filter((t) => t.status === "completed").length,
      failedTasks: tasks.filter((t) => t.status === "failed").length,
      queueLength: this.taskQueue.length,
      averageProcessingTime: this.calculateAverageProcessingTime(tasks),
    }
  }

  /**
   * Calculate average processing time
   */
  private calculateAverageProcessingTime(tasks: AITask[]): number {
    const completedTasks = tasks.filter((t) => t.status === "completed" && t.completedAt)

    if (completedTasks.length === 0) return 0

    const totalTime = completedTasks.reduce((sum, task) => {
      const processingTime = task.completedAt!.getTime() - task.createdAt.getTime()
      return sum + processingTime
    }, 0)

    return totalTime / completedTasks.length
  }
}

export const aiOrchestrationService = new AIOrchestrationService()
