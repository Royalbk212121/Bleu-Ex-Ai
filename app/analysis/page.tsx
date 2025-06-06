"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { AnalysisStats } from "@/components/analysis/stats"
import { RiskDistribution } from "@/components/analysis/risk-distribution"
import { RecentAnalyses } from "@/components/analysis/recent-analyses"
import { AnalysisTools } from "@/components/analysis/tools"

export default function DocumentAnalysis() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Document Analysis" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">Document Analysis</h1>
                <p className="text-gray-600">AI-powered insights and risk assessment</p>
              </div>
              <Button className="bg-black hover:bg-gray-800">
                <FileText className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </div>

            {/* Stats Cards */}
            <AnalysisStats />

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Risk Distribution */}
              <RiskDistribution />

              {/* Recent Analyses */}
              <RecentAnalyses />
            </div>

            {/* Analysis Tools */}
            <AnalysisTools />
          </div>
        </main>
      </div>
    </div>
  )
}
