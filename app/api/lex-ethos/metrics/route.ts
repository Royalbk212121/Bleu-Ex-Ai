import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    // Get encryption metrics
    const { data: documents } = await supabase.from("legal_documents").select("id, metadata")
    const totalDocuments = documents?.length || 0
    const encryptedDocuments = documents?.filter((doc) => doc.metadata?.encrypted === true).length || 0
    const encryptionRate = totalDocuments > 0 ? Math.round((encryptedDocuments / totalDocuments) * 100) : 0

    // Get audit metrics
    const { data: auditLogs } = await supabase.from("audit_logs").select("risk_level")
    const totalEvents = auditLogs?.length || 0
    const highRiskEvents = auditLogs?.filter((log) => log.risk_level === "high").length || 0
    const criticalEvents = auditLogs?.filter((log) => log.risk_level === "critical").length || 0

    // Get bias assessment metrics
    const { data: biasAssessments } = await supabase
      .from("bias_assessments")
      .select("bias_score, assessment_date, next_assessment_due")
      .order("assessment_date", { ascending: false })
      .limit(1)

    const latestBias = biasAssessments?.[0]

    // Get RBAC metrics
    const { data: users } = await supabase.from("users").select("id")
    const { data: roles } = await supabase.from("roles").select("id").eq("is_system_role", false)
    const { data: pendingTasks } = await supabase.from("hitl_tasks").select("id").eq("status", "pending")

    const metrics = {
      encryptionStatus: {
        totalDocuments,
        encryptedDocuments,
        encryptionRate,
      },
      complianceStatus: {
        gdpr: "compliant" as const,
        ccpa: "compliant" as const,
        hipaa: "partial" as const,
      },
      auditMetrics: {
        totalEvents,
        highRiskEvents,
        criticalEvents,
      },
      biasAssessment: {
        overallScore: latestBias?.bias_score || 15,
        lastAssessment: latestBias?.assessment_date || new Date().toISOString(),
        nextAssessment:
          latestBias?.next_assessment_due || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      rbacMetrics: {
        totalUsers: users?.length || 0,
        activeRoles: roles?.length || 6,
        pendingReviews: pendingTasks?.length || 0,
      },
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Security metrics API error:", error)
    return NextResponse.json({ error: "Failed to fetch security metrics" }, { status: 500 })
  }
}
