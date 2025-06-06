"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Brain, FileText, Search, Shield, Zap, Users } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Research",
      description: "Advanced AI models for comprehensive legal research and analysis",
      href: "/research",
    },
    {
      icon: FileText,
      title: "Document Analysis",
      description: "Intelligent document processing and risk assessment",
      href: "/documents",
    },
    {
      icon: Search,
      title: "Knowledge Graph",
      description: "Explore interconnected legal concepts and precedents",
      href: "/knowledge-graph",
    },
    {
      icon: Shield,
      title: "Compliance Monitoring",
      description: "Real-time regulatory compliance tracking and alerts",
      href: "/compliance",
    },
    {
      icon: Users,
      title: "Agent Swarm",
      description: "Collaborative AI agents for complex legal tasks",
      href: "/agents",
    },
    {
      icon: Zap,
      title: "Smart Editor",
      description: "AI-assisted legal document drafting and editing",
      href: "/editor",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LegalAI Platform
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Link href="/chat">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 Next-Generation Legal AI
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Transform Legal Work with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Harness the power of advanced AI models, knowledge graphs, and intelligent agents to revolutionize legal
            research, document analysis, and compliance monitoring.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Launch Platform
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/research">
              <Button size="lg" variant="outline">
                Try Research
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Comprehensive Legal AI Suite</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need for modern legal practice, powered by cutting-edge AI technology
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link key={index} href={feature.href}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <CardHeader>
                    <div className="h-12 w-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">10M+</div>
              <div className="text-gray-600">Documents Processed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">50%</div>
              <div className="text-gray-600">Time Saved</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">AI Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-6 w-6" />
                <span className="text-lg font-bold">LegalAI</span>
              </div>
              <p className="text-gray-400">Advanced AI platform for legal professionals</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <div className="space-y-2 text-gray-400">
                <Link href="/dashboard" className="block hover:text-white">
                  Dashboard
                </Link>
                <Link href="/research" className="block hover:text-white">
                  Research
                </Link>
                <Link href="/documents" className="block hover:text-white">
                  Documents
                </Link>
                <Link href="/analysis" className="block hover:text-white">
                  Analysis
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">AI Tools</h3>
              <div className="space-y-2 text-gray-400">
                <Link href="/chat" className="block hover:text-white">
                  Chat Assistant
                </Link>
                <Link href="/agents" className="block hover:text-white">
                  Agent Swarm
                </Link>
                <Link href="/knowledge-graph" className="block hover:text-white">
                  Knowledge Graph
                </Link>
                <Link href="/compliance" className="block hover:text-white">
                  Compliance
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="space-y-2 text-gray-400">
                <Link href="/settings" className="block hover:text-white">
                  Settings
                </Link>
                <Link href="/admin/database" className="block hover:text-white">
                  Admin
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LegalAI Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
