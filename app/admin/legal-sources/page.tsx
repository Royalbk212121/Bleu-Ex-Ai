"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { BulkDownloadManager } from "@/components/legal-sources/bulk-download-manager"

export default function LegalSourcesAdminPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Legal Sources Administration" />
        <main className="flex-1 overflow-y-auto">
          <div className="gradient-bg min-h-full">
            <div className="max-w-7xl mx-auto p-6">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold font-playfair text-gradient">Legal Sources Management</h1>
                  <p className="text-muted-foreground mt-2">
                    Download, curate, and manage legal documents from external sources
                  </p>
                </div>

                <BulkDownloadManager />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
