"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, FileText, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      title: "Start Legal Research",
      description: "Ask AI about case law, statutes, or legal concepts",
      icon: MessageSquare,
      href: "/research",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Upload Document",
      description: "Upload and analyze contracts, briefs, or other legal documents",
      icon: FileText,
      href: "/documents",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "Create New Document",
      description: "Start drafting with AI-powered assistance",
      icon: Sparkles,
      href: "/editor",
      gradient: "from-purple-500 to-pink-500",
    },
  ]

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="w-6 h-6 legal-gradient rounded-lg flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-playfair">Quick Actions</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">Get started with common legal AI tasks</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => (
          <Link href={action.href} key={index}>
            <Button
              variant="outline"
              className="w-full justify-between h-auto p-4 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-r ${action.gradient} group-hover:scale-110 transition-transform duration-300`}
                >
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-muted-foreground">{action.description}</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
