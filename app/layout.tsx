import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SupabaseProvider } from "@/contexts/supabase-context"
import { StoreProvider } from "@/lib/store/provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LegalAI Platform",
  description: "Advanced AI-powered legal research and document analysis platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <StoreProvider>
            <SupabaseProvider>
              {children}
              <Toaster />
            </SupabaseProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
