"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Upload, Plus, Bell, Sparkles } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

interface HeaderProps {
  title?: string
}

export function Header({ title = "Legal Research" }: HeaderProps) {
  return (
    <header className="bg-card/80 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 legal-gradient rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-semibold font-playfair">{title}</h2>
            </div>
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              Pro
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents, cases, or ask a question..."
                className="w-96 pl-10 bg-background/50 border-border/50 focus:border-primary transition-colors"
              />
            </div>

            <Link href="/documents">
              <Button variant="outline" size="sm" className="hover:bg-accent transition-colors">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </Link>

            <Button size="sm" className="legal-gradient text-white hover:shadow-lg transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>

            <Button variant="ghost" size="sm" className="relative hover:bg-accent transition-colors">
              <Bell className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
