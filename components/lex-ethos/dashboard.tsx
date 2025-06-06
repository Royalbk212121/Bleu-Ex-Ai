"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Lock, Eye, Users, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface SecurityMetrics {
  encryptionStatus: {
    totalDocuments: number
    encryptedDocuments: number
    encryptionRate: number
  }
  complianceStatus: {
    gdpr: "compliant" | "non_compliant" | "partial"
    ccpa: "compliant" | "non_compliant" | "partial"
    hipaa: "compliant" | "non_compliant" | "partial"
  }
  auditMetrics: {
    totalEvents: number
    highRiskEvents: number
    criticalEvents: number
  }
  biasAssessment: {
    overallScore: number
    lastAssessment: string
    nextAssessment: string
  }
  rbacMetrics: {
    totalUsers: number
    activeRoles: number
    pendingReviews: number
  }
}

export function LexEthosDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSecurityMetrics()
  }, [])

  const fetchSecurityMetrics = async () => {
    try {
      const response = await fetch("/api/lex-ethos/metrics")
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error("Failed to fetch security metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "non_compliant":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "partial":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getComplianceColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-800"
      case "non_compliant":
        return "bg-red-100 text-red-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Failed to load security metrics. Please try again.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LexEthos™ Security Dashboard</h1>
          <p className="text-muted-foreground">Security, Ethics & Compliance by Design</p>
        </div>
        <Button onClick={fetchSecurityMetrics}>Refresh Metrics</Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encryption Status</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.encryptionStatus.encryptionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.encryptionStatus.encryptedDocuments} of {metrics.encryptionStatus.totalDocuments} documents
            </p>
            <Progress value={metrics.encryptionStatus.encryptionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Events</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.auditMetrics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.auditMetrics.criticalEvents} critical, {metrics.auditMetrics.highRiskEvents} high-risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bias Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.biasAssessment.overallScore}/100</div>
            <p className="text-xs text-muted-foreground">Lower is better</p>
            <Progress
              value={100 - metrics.biasAssessment.overallScore}
              className="mt-2"
              // @ts-ignore
              indicatorClassName="bg-green-500"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RBAC Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rbacMetrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.rbacMetrics.activeRoles} roles, {metrics.rbacMetrics.pendingReviews} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="compliance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="encryption">Encryption</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="bias">Bias Assessment</TabsTrigger>
          <TabsTrigger value="rbac">Access Control</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>Current compliance status across regulatory frameworks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getComplianceIcon(metrics.complianceStatus.gdpr)}
                  <span className="font-medium">GDPR</span>
                </div>
                <Badge className={getComplianceColor(metrics.complianceStatus.gdpr)}>
                  {metrics.complianceStatus.gdpr.replace("_", " ").toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getComplianceIcon(metrics.complianceStatus.ccpa)}
                  <span className="font-medium">CCPA</span>
                </div>
                <Badge className={getComplianceColor(metrics.complianceStatus.ccpa)}>
                  {metrics.complianceStatus.ccpa.replace("_", " ").toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getComplianceIcon(metrics.complianceStatus.hipaa)}
                  <span className="font-medium">HIPAA</span>
                </div>
                <Badge className={getComplianceColor(metrics.complianceStatus.hipaa)}>
                  {metrics.complianceStatus.hipaa.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encryption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Encryption Management</CardTitle>
              <CardDescription>End-to-end encryption status and key management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrics.encryptionStatus.encryptedDocuments}</div>
                  <p className="text-sm text-muted-foreground">Encrypted Documents</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">AES-256</div>
                  <p className="text-sm text-muted-foreground">Encryption Standard</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">E2EE</div>
                  <p className="text-sm text-muted-foreground">End-to-End Encrypted</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Encryption Coverage</span>
                  <span>{metrics.encryptionStatus.encryptionRate}%</span>
                </div>
                <Progress value={metrics.encryptionStatus.encryptionRate} />
              </div>

              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  All client data is encrypted at rest and in transit with user-controlled key management options.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Comprehensive logging of all AI decisions and user actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{metrics.auditMetrics.totalEvents}</div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{metrics.auditMetrics.highRiskEvents}</div>
                  <p className="text-sm text-muted-foreground">High Risk</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{metrics.auditMetrics.criticalEvents}</div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                </div>
              </div>

              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  Every AI decision-making process, prompt, and response is logged for full transparency and compliance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bias Mitigation & Fairness</CardTitle>
              <CardDescription>Ongoing ethical AI audits and bias detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrics.biasAssessment.overallScore}</div>
                  <p className="text-sm text-muted-foreground">Overall Bias Score (Lower is Better)</p>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">Next Assessment</div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(metrics.biasAssessment.nextAssessment).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Fairness Score</span>
                  <span>{100 - metrics.biasAssessment.overallScore}%</span>
                </div>
                <Progress value={100 - metrics.biasAssessment.overallScore} />
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Continuous bias monitoring ensures equitable and just AI outcomes across all legal domains.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rbac" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access Control</CardTitle>
              <CardDescription>Granular permissions and user access management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{metrics.rbacMetrics.totalUsers}</div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metrics.rbacMetrics.activeRoles}</div>
                  <p className="text-sm text-muted-foreground">Active Roles</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{metrics.rbacMetrics.pendingReviews}</div>
                  <p className="text-sm text-muted-foreground">Pending Reviews</p>
                </div>
              </div>

              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Granular permissions control access to specific modules, matters, and document types.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
