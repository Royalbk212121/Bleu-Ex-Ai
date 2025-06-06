import { NextResponse } from "next/server"
import { GoogleScholarScraper } from "@/lib/legal-sources/google-scholar-scraper"
import { JustiaAPI } from "@/lib/legal-sources/justia-api"
import { CourtListenerAPI } from "@/lib/legal-sources/court-listener-api"

export async function POST(request: Request) {
  try {
    const {
      sources = ["google_scholar", "justia", "court_listener"],
      queries = [],
      options = {},
    } = await request.json()

    if (!queries || queries.length === 0) {
      return NextResponse.json({ error: "Queries array is required" }, { status: 400 })
    }

    const results = {
      google_scholar: [],
      justia: [],
      court_listener: [],
      summary: {
        totalDownloaded: 0,
        totalFailed: 0,
        processingTime: 0,
      },
    }

    const startTime = Date.now()

    // Download from Google Scholar
    if (sources.includes("google_scholar")) {
      try {
        const googleScholar = new GoogleScholarScraper()
        for (const query of queries) {
          const downloaded = await googleScholar.searchAndDownload(query, options)
          results.google_scholar.push(...downloaded)
        }
      } catch (error) {
        console.error("Google Scholar bulk download error:", error)
      }
    }

    // Download from Justia
    if (sources.includes("justia")) {
      try {
        const justia = new JustiaAPI()
        for (const query of queries) {
          const downloaded = await justia.searchAndDownload(query, options)
          results.justia.push(...downloaded)
        }
      } catch (error) {
        console.error("Justia bulk download error:", error)
      }
    }

    // Download from CourtListener
    if (sources.includes("court_listener")) {
      try {
        const courtListener = new CourtListenerAPI()
        for (const query of queries) {
          const downloaded = await courtListener.searchAndDownload(query, options)
          results.court_listener.push(...downloaded)
        }
      } catch (error) {
        console.error("CourtListener bulk download error:", error)
      }
    }

    // Calculate summary
    const allResults = [...results.google_scholar, ...results.justia, ...results.court_listener]
    results.summary.totalDownloaded = allResults.filter((r) => r.status === "downloaded").length
    results.summary.totalFailed = allResults.filter((r) => r.status === "failed").length
    results.summary.processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Bulk download error:", error)
    return NextResponse.json({ error: "Bulk download failed" }, { status: 500 })
  }
}
