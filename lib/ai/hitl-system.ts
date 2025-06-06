/**
 * Human-in-the-Loop (HITL) Integration System
 * Manages tasks that require human expert review and validation
 */

import { getSupabaseAdmin } from "@/lib/supabase/server"
import type { ValidationResult, HITLTask } from "./veritas-shield"

export interface HITLWorkflow {
  id: string
  name: string
  description: string
  triggerConditions: HITLTrigger[]
  assignmentRules: AssignmentRule[]
  escalationRules: EscalationRule[]
  slaHours: number
  isActive: boolean
}

export interface HITLTrigger {
  type: "confidence_threshold" | "flag_severity" | "content_type" | "custom"
  condition: string
  threshold?: number
  priority: "low" | "medium" | "high" | "urgent"
}

export interface AssignmentRule {
  condition: string
  assigneeType: "role" | "user" | "pool"
  assigneeId: string
  priority: number
}

export interface EscalationRule {
  triggerAfterHours: number
  escalateTo: string
  escalationType: "role" | "user"
  notificationMethod: "email" | "slack" | "dashboard"
}

export interface HITLReview {
  taskId: string
  reviewerId: string
  reviewerName: string
  decision: "approve" | "reject" | "modify" | "escalate"
  modifications?: string
  reasoning: string
  confidenceOverride?: number
  reviewTimestamp: string
  timeSpentMinutes: number
}

export interface HITLMetrics {
  totalTasks: number
  pendingTasks: number
  completedTasks: number
  averageResolutionTime: number
  accuracyRate: number
  escalationRate: number
  reviewerPerformance: Record<string, any>
}

/**
 * Human-in-the-Loop System for VeritasShield™
 */
export class HITLSystem {
  private supabase = getSupabaseAdmin()

  /**
   * Create a new HITL task based on validation results
   */
  async createTask(
    validationResult: ValidationResult,
    content: string,
    context: Record<string, any> = {},
  ): Promise<HITLTask> {
    const workflow = await this.selectWorkflow(validationResult, context)
    const assignee = await this.assignTask(workflow, validationResult)
    const priority = this.determinePriority(validationResult)

    const task: HITLTask = {
      id: `hitl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskType: this.determineTaskType(validationResult),
      priority,
      content,
      confidenceScore: validationResult.confidenceScore,
      flaggedIssues: validationResult.flaggedContent,
      assignedTo: assignee,
      status: "pending",
      deadline: new Date(Date.now() + (workflow?.slaHours || 24) * 60 * 60 * 1000).toISOString(),
      metadata: {
        ...context,
        workflowId: workflow?.id,
        validationHash: validationResult.blockchainHash,
        createdAt: new Date().toISOString(),
      },
    }

    // Store task in database
    await this.supabase.from("hitl_tasks").insert(task)

    // Send notifications
    await this.sendTaskNotification(task)

    // Schedule escalation if needed
    if (workflow?.escalationRules) {
      await this.scheduleEscalation(task, workflow.escalationRules)
    }

    return task
  }

  /**
   * Submit a review for a HITL task
   */
  async submitReview(
    taskId: string,
    reviewerId: string,
    review: Omit<HITLReview, "taskId" | "reviewerId" | "reviewTimestamp">,
  ): Promise<void> {
    const fullReview: HITLReview = {
      taskId,
      reviewerId,
      reviewTimestamp: new Date().toISOString(),
      ...review,
    }

    // Store review
    await this.supabase.from("hitl_reviews").insert(fullReview)

    // Update task status
    const newStatus = this.determineTaskStatus(fullReview.decision)
    await this.supabase
      .from("hitl_tasks")
      .update({
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", taskId)

    // Handle escalation if needed
    if (fullReview.decision === "escalate") {
      await this.escalateTask(taskId)
    }

    // Update validation record with human review
    await this.updateValidationWithReview(taskId, fullReview)

    // Send completion notifications
    await this.sendReviewNotification(taskId, fullReview)
  }

  /**
   * Get pending tasks for a user or role
   */
  async getPendingTasks(
    assigneeId: string,
    filters: {
      priority?: string[]
      taskType?: string[]
      limit?: number
    } = {},
  ): Promise<HITLTask[]> {
    let query = this.supabase
      .from("hitl_tasks")
      .select("*")
      .eq("assigned_to", assigneeId)
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })

    if (filters.priority) {
      query = query.in("priority", filters.priority)
    }

    if (filters.taskType) {
      query = query.in("task_type", filters.taskType)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching pending tasks:", error)
      return []
    }

    return data || []
  }

  /**
   * Get HITL system metrics
   */
  async getMetrics(timeframe: "day" | "week" | "month" = "week"): Promise<HITLMetrics> {
    const startDate = new Date()
    switch (timeframe) {
      case "day":
        startDate.setDate(startDate.getDate() - 1)
        break
      case "week":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "month":
        startDate.setMonth(startDate.getMonth() - 1)
        break
    }

    const { data: tasks } = await this.supabase
      .from("hitl_tasks")
      .select("*")
      .gte("created_at", startDate.toISOString())

    const { data: reviews } = await this.supabase
      .from("hitl_reviews")
      .select("*")
      .gte("review_timestamp", startDate.toISOString())

    const totalTasks = tasks?.length || 0
    const pendingTasks = tasks?.filter((t) => t.status === "pending").length || 0
    const completedTasks = tasks?.filter((t) => t.status === "completed").length || 0

    // Calculate average resolution time
    const completedTasksWithTime = tasks?.filter((t) => t.status === "completed" && t.completed_at) || []
    const averageResolutionTime =
      completedTasksWithTime.length > 0
        ? completedTasksWithTime.reduce((sum, task) => {
            const created = new Date(task.created_at).getTime()
            const completed = new Date(task.completed_at).getTime()
            return sum + (completed - created)
          }, 0) /
          completedTasksWithTime.length /
          (1000 * 60 * 60) // Convert to hours
        : 0

    // Calculate accuracy rate (approved reviews / total reviews)
    const approvedReviews = reviews?.filter((r) => r.decision === "approve").length || 0
    const accuracyRate = reviews?.length ? (approvedReviews / reviews.length) * 100 : 0

    // Calculate escalation rate
    const escalatedTasks = tasks?.filter((t) => t.status === "escalated").length || 0
    const escalationRate = totalTasks > 0 ? (escalatedTasks / totalTasks) * 100 : 0

    // Reviewer performance
    const reviewerPerformance: Record<string, any> = {}
    reviews?.forEach((review) => {
      if (!reviewerPerformance[review.reviewer_id]) {
        reviewerPerformance[review.reviewer_id] = {
          totalReviews: 0,
          averageTime: 0,
          approvalRate: 0,
          approvedCount: 0,
        }
      }

      const perf = reviewerPerformance[review.reviewer_id]
      perf.totalReviews++
      perf.averageTime = (perf.averageTime * (perf.totalReviews - 1) + review.time_spent_minutes) / perf.totalReviews

      if (review.decision === "approve") {
        perf.approvedCount++
      }

      perf.approvalRate = (perf.approvedCount / perf.totalReviews) * 100
    })

    return {
      totalTasks,
      pendingTasks,
      completedTasks,
      averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
      accuracyRate: Math.round(accuracyRate),
      escalationRate: Math.round(escalationRate),
      reviewerPerformance,
    }
  }

  /**
   * Create or update HITL workflow
   */
  async createWorkflow(workflow: Omit<HITLWorkflow, "id">): Promise<HITLWorkflow> {
    const fullWorkflow: HITLWorkflow = {
      id: `workflow_${Date.now()}`,
      ...workflow,
    }

    await this.supabase.from("hitl_workflows").insert(fullWorkflow)
    return fullWorkflow
  }

  // Private helper methods

  private async selectWorkflow(
    validationResult: ValidationResult,
    context: Record<string, any>,
  ): Promise<HITLWorkflow | null> {
    const { data: workflows } = await this.supabase.from("hitl_workflows").select("*").eq("is_active", true)

    if (!workflows) return null

    // Find matching workflow based on triggers
    for (const workflow of workflows) {
      if (this.workflowMatches(workflow, validationResult, context)) {
        return workflow
      }
    }

    return workflows[0] // Default workflow
  }

  private workflowMatches(
    workflow: HITLWorkflow,
    validationResult: ValidationResult,
    context: Record<string, any>,
  ): boolean {
    return workflow.triggerConditions.some((trigger) => {
      switch (trigger.type) {
        case "confidence_threshold":
          return validationResult.confidenceScore.overall < (trigger.threshold || 75)
        case "flag_severity":
          return validationResult.flaggedContent.some((flag) => flag.severity === trigger.condition)
        case "content_type":
          return context.contentType === trigger.condition
        default:
          return false
      }
    })
  }

  private async assignTask(workflow: HITLWorkflow | null, validationResult: ValidationResult): Promise<string> {
    if (!workflow?.assignmentRules) {
      return "default_reviewer" // Fallback
    }

    // Apply assignment rules in priority order
    const sortedRules = workflow.assignmentRules.sort((a, b) => b.priority - a.priority)

    for (const rule of sortedRules) {
      if (this.assignmentRuleMatches(rule, validationResult)) {
        return rule.assigneeId
      }
    }

    return workflow.assignmentRules[0]?.assigneeId || "default_reviewer"
  }

  private assignmentRuleMatches(rule: AssignmentRule, validationResult: ValidationResult): boolean {
    // Simplified rule matching - can be expanded
    return true
  }

  private determinePriority(validationResult: ValidationResult): "low" | "medium" | "high" | "urgent" {
    if (validationResult.confidenceScore.overall < 25) return "urgent"
    if (validationResult.flaggedContent.some((f) => f.severity === "critical")) return "urgent"
    if (validationResult.confidenceScore.overall < 50) return "high"
    if (validationResult.flaggedContent.some((f) => f.severity === "high")) return "high"
    return "medium"
  }

  private determineTaskType(validationResult: ValidationResult): "validation" | "correction" | "review" | "approval" {
    if (validationResult.flaggedContent.some((f) => f.requiresRemoval)) return "correction"
    if (validationResult.confidenceScore.overall < 50) return "validation"
    return "review"
  }

  private determineTaskStatus(decision: string): string {
    switch (decision) {
      case "approve":
      case "reject":
      case "modify":
        return "completed"
      case "escalate":
        return "escalated"
      default:
        return "in_progress"
    }
  }

  private async escalateTask(taskId: string): Promise<void> {
    // Implementation for task escalation
    console.log(`Escalating task ${taskId}`)
  }

  private async updateValidationWithReview(taskId: string, review: HITLReview): Promise<void> {
    // Update the original validation record with human review results
    await this.supabase
      .from("veritas_validations")
      .update({
        human_reviewed: true,
        human_decision: review.decision,
        human_confidence_override: review.confidenceOverride,
        human_reasoning: review.reasoning,
        reviewed_at: review.reviewTimestamp,
      })
      .eq("hitl_task_id", taskId)
  }

  private async sendTaskNotification(task: HITLTask): Promise<void> {
    // Implementation for sending notifications
    console.log(`Sending notification for task ${task.id} to ${task.assignedTo}`)
  }

  private async sendReviewNotification(taskId: string, review: HITLReview): Promise<void> {
    // Implementation for sending review completion notifications
    console.log(`Review completed for task ${taskId} by ${review.reviewerId}`)
  }

  private async scheduleEscalation(task: HITLTask, escalationRules: EscalationRule[]): Promise<void> {
    // Implementation for scheduling automatic escalation
    console.log(`Scheduling escalation for task ${task.id}`)
  }
}

export const hitlSystem = new HITLSystem()
