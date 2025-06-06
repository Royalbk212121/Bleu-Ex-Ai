"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  BookOpen,
  FileText,
  Home,
  LayoutDashboard,
  MessageSquare,
  Network,
  Settings,
  ShieldCheck,
  Database,
  Gauge,
  Cpu,
  Users,
  Layers,
} from "lucide-react"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12 w-full", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Main</h2>
          <div className="space-y-1">
            <Link
              href="/"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === "/" ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === "/dashboard" ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Legal Tools</h2>
          <div className="space-y-1">
            <Link
              href="/documents"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/documents") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Documents</span>
            </Link>
            <Link
              href="/editor"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/editor") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Editor</span>
            </Link>
            <Link
              href="/analysis"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/analysis") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Analysis</span>
            </Link>
            <Link
              href="/chat"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/chat") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Chat</span>
            </Link>
            <Link
              href="/research"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/research") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Research</span>
            </Link>
            <Link
              href="/legal-sources"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/legal-sources") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <Layers className="mr-2 h-4 w-4" />
              <span>Legal Sources</span>
            </Link>
            <Link
              href="/knowledge-graph"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/knowledge-graph") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <Network className="mr-2 h-4 w-4" />
              <span>Knowledge Graph</span>
            </Link>
            <Link
              href="/compliance"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/compliance") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Compliance</span>
            </Link>
            <Link
              href="/agents"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/agents") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Agent Swarm</span>
            </Link>
          </div>
        </div>

        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Administration</h2>
          <div className="space-y-1">
            <Link
              href="/admin/database"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/admin/database") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <Database className="mr-2 h-4 w-4" />
              <span>Database</span>
            </Link>
            <Link
              href="/admin/data-infrastructure"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/admin/data-infrastructure") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <Layers className="mr-2 h-4 w-4" />
              <span>Data Infrastructure</span>
            </Link>
            <Link
              href="/admin/ai-infrastructure"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/admin/ai-infrastructure") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <Cpu className="mr-2 h-4 w-4" />
              <span>AI Infrastructure</span>
            </Link>
            <Link
              href="/admin/performance"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/admin/performance") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <Gauge className="mr-2 h-4 w-4" />
              <span>Performance</span>
            </Link>
            <Link
              href="/settings"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname?.startsWith("/settings") ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
