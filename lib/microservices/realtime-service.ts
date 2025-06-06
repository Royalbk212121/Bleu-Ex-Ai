/**
 * Real-time Service
 * Manages WebSocket connections for streaming AI responses
 */

import { Server as SocketIOServer } from "socket.io"
import { createAdapter } from "@socket.io/redis-adapter"
import { createClient } from "redis"
import jwt from "jsonwebtoken"

interface SocketUser {
  id: string
  email: string
  role: string
  subscriptionTier: string
}

interface StreamingSession {
  sessionId: string
  userId: string
  type: "chat" | "document_analysis" | "ai_assistance"
  status: "active" | "paused" | "completed"
  startedAt: Date
}

export class RealtimeService {
  private io: SocketIOServer | null = null
  private activeSessions: Map<string, StreamingSession> = new Map()
  private userSockets: Map<string, string[]> = new Map() // userId -> socketIds

  constructor() {
    this.setupRedisAdapter()
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(server: any) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    })

    this.setupEventHandlers()
    console.log("Real-time service initialized")
  }

  /**
   * Setup Redis adapter for scaling
   */
  private async setupRedisAdapter() {
    if (process.env.REDIS_URL) {
      try {
        const pubClient = createClient({ url: process.env.REDIS_URL })
        const subClient = pubClient.duplicate()

        await Promise.all([pubClient.connect(), subClient.connect()])

        if (this.io) {
          this.io.adapter(createAdapter(pubClient, subClient))
          console.log("Redis adapter configured for Socket.IO")
        }
      } catch (error) {
        console.warn("Redis adapter setup failed:", error)
      }
    }
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers() {
    if (!this.io) return

    this.io.use(this.authenticateSocket.bind(this))

    this.io.on("connection", (socket) => {
      const user = socket.data.user as SocketUser
      console.log(`User ${user.email} connected: ${socket.id}`)

      // Track user socket
      this.addUserSocket(user.id, socket.id)

      // Join user-specific room
      socket.join(`user:${user.id}`)

      // Handle chat streaming
      socket.on("start_chat_stream", (data) => {
        this.handleChatStream(socket, data)
      })

      // Handle document analysis streaming
      socket.on("start_document_analysis", (data) => {
        this.handleDocumentAnalysis(socket, data)
      })

      // Handle AI assistance streaming
      socket.on("start_ai_assistance", (data) => {
        this.handleAIAssistance(socket, data)
      })

      // Handle session management
      socket.on("pause_session", (sessionId) => {
        this.pauseSession(sessionId)
      })

      socket.on("resume_session", (sessionId) => {
        this.resumeSession(sessionId)
      })

      socket.on("end_session", (sessionId) => {
        this.endSession(sessionId)
      })

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`User ${user.email} disconnected: ${socket.id}`)
        this.removeUserSocket(user.id, socket.id)
      })
    })
  }

  /**
   * Authenticate socket connection
   */
  private async authenticateSocket(socket: any, next: any) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1]

      if (!token) {
        return next(new Error("Authentication token required"))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      socket.data.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        subscriptionTier: decoded.subscriptionTier,
      }

      next()
    } catch (error) {
      next(new Error("Invalid authentication token"))
    }
  }

  /**
   * Handle chat streaming
   */
  private async handleChatStream(socket: any, data: { sessionId: string; message: string }) {
    try {
      const user = socket.data.user as SocketUser
      const sessionId = data.sessionId || this.generateSessionId()

      // Create streaming session
      const session: StreamingSession = {
        sessionId,
        userId: user.id,
        type: "chat",
        status: "active",
        startedAt: new Date(),
      }

      this.activeSessions.set(sessionId, session)

      // Join session room
      socket.join(`session:${sessionId}`)

      // Emit session started
      socket.emit("stream_started", { sessionId, type: "chat" })

      // Simulate streaming response (in production, this would call your AI service)
      await this.simulateStreamingResponse(sessionId, data.message)
    } catch (error) {
      console.error("Chat stream error:", error)
      socket.emit("stream_error", { error: "Failed to start chat stream" })
    }
  }

  /**
   * Handle document analysis streaming
   */
  private async handleDocumentAnalysis(socket: any, data: { documentId: string; analysisType: string }) {
    try {
      const user = socket.data.user as SocketUser
      const sessionId = this.generateSessionId()

      const session: StreamingSession = {
        sessionId,
        userId: user.id,
        type: "document_analysis",
        status: "active",
        startedAt: new Date(),
      }

      this.activeSessions.set(sessionId, session)
      socket.join(`session:${sessionId}`)

      socket.emit("analysis_started", { sessionId, documentId: data.documentId })

      // Simulate document analysis streaming
      await this.simulateDocumentAnalysis(sessionId, data.documentId, data.analysisType)
    } catch (error) {
      console.error("Document analysis error:", error)
      socket.emit("analysis_error", { error: "Failed to start document analysis" })
    }
  }

  /**
   * Handle AI assistance streaming
   */
  private async handleAIAssistance(socket: any, data: { context: string; action: string }) {
    try {
      const user = socket.data.user as SocketUser
      const sessionId = this.generateSessionId()

      const session: StreamingSession = {
        sessionId,
        userId: user.id,
        type: "ai_assistance",
        status: "active",
        startedAt: new Date(),
      }

      this.activeSessions.set(sessionId, session)
      socket.join(`session:${sessionId}`)

      socket.emit("assistance_started", { sessionId, action: data.action })

      // Simulate AI assistance streaming
      await this.simulateAIAssistance(sessionId, data.context, data.action)
    } catch (error) {
      console.error("AI assistance error:", error)
      socket.emit("assistance_error", { error: "Failed to start AI assistance" })
    }
  }

  /**
   * Stream data to session
   */
  streamToSession(sessionId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`session:${sessionId}`).emit(event, data)
    }
  }

  /**
   * Stream data to user
   */
  streamToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data)
    }
  }

  /**
   * Pause streaming session
   */
  private pauseSession(sessionId: string) {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.status = "paused"
      this.streamToSession(sessionId, "session_paused", { sessionId })
    }
  }

  /**
   * Resume streaming session
   */
  private resumeSession(sessionId: string) {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.status = "active"
      this.streamToSession(sessionId, "session_resumed", { sessionId })
    }
  }

  /**
   * End streaming session
   */
  private endSession(sessionId: string) {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.status = "completed"
      this.streamToSession(sessionId, "session_ended", { sessionId })
      this.activeSessions.delete(sessionId)
    }
  }

  /**
   * Track user socket connections
   */
  private addUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId) || []
    sockets.push(socketId)
    this.userSockets.set(userId, sockets)
  }

  /**
   * Remove user socket connection
   */
  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId) || []
    const filtered = sockets.filter((id) => id !== socketId)

    if (filtered.length === 0) {
      this.userSockets.delete(userId)
    } else {
      this.userSockets.set(userId, filtered)
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Simulate streaming response (replace with actual AI service calls)
   */
  private async simulateStreamingResponse(sessionId: string, message: string) {
    const words = `Based on your query about "${message}", here's a comprehensive legal analysis. 
    This response demonstrates real-time streaming capabilities where each word appears 
    progressively to create an engaging user experience. In production, this would be 
    connected to your actual AI service that processes legal queries and returns 
    structured responses with citations and supporting documentation.`.split(" ")

    for (let i = 0; i < words.length; i++) {
      const session = this.activeSessions.get(sessionId)
      if (!session || session.status !== "active") break

      this.streamToSession(sessionId, "stream_chunk", {
        chunk: words[i] + " ",
        index: i,
        total: words.length,
      })

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    this.streamToSession(sessionId, "stream_complete", { sessionId })
    this.endSession(sessionId)
  }

  /**
   * Simulate document analysis streaming
   */
  private async simulateDocumentAnalysis(sessionId: string, documentId: string, analysisType: string) {
    const steps = [
      "Parsing document structure...",
      "Extracting key legal concepts...",
      "Analyzing contract clauses...",
      "Identifying potential risks...",
      "Generating recommendations...",
      "Finalizing analysis report...",
    ]

    for (let i = 0; i < steps.length; i++) {
      const session = this.activeSessions.get(sessionId)
      if (!session || session.status !== "active") break

      this.streamToSession(sessionId, "analysis_progress", {
        step: steps[i],
        progress: ((i + 1) / steps.length) * 100,
        stepIndex: i + 1,
        totalSteps: steps.length,
      })

      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    this.streamToSession(sessionId, "analysis_complete", {
      sessionId,
      documentId,
      results: {
        riskLevel: "medium",
        issues: 3,
        recommendations: 5,
        confidence: 0.87,
      },
    })

    this.endSession(sessionId)
  }

  /**
   * Simulate AI assistance streaming
   */
  private async simulateAIAssistance(sessionId: string, context: string, action: string) {
    const suggestions = [
      "Reviewing selected text for legal accuracy...",
      "Searching relevant case law and precedents...",
      "Analyzing contractual implications...",
      "Generating improvement suggestions...",
    ]

    for (let i = 0; i < suggestions.length; i++) {
      const session = this.activeSessions.get(sessionId)
      if (!session || session.status !== "active") break

      this.streamToSession(sessionId, "assistance_progress", {
        status: suggestions[i],
        progress: ((i + 1) / suggestions.length) * 100,
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    this.streamToSession(sessionId, "assistance_complete", {
      sessionId,
      action,
      suggestions: [
        "Consider adding a force majeure clause",
        "Specify exact timeframes instead of 'reasonable time'",
        "Include jurisdiction and governing law clauses",
      ],
    })

    this.endSession(sessionId)
  }

  /**
   * Get active sessions for user
   */
  getActiveSessions(userId: string): StreamingSession[] {
    return Array.from(this.activeSessions.values()).filter(
      (session) => session.userId === userId && session.status === "active",
    )
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      activeSessions: this.activeSessions.size,
      connectedUsers: this.userSockets.size,
      totalSockets: Array.from(this.userSockets.values()).reduce((sum, sockets) => sum + sockets.length, 0),
    }
  }
}

export const realtimeService = new RealtimeService()
