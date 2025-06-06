import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { query, limit = 5 } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Mock live search results for demonstration
    // In production, this would integrate with actual legal APIs
    const mockResults = [
      {
        id: "live-1",
        title: "Recent Supreme Court Decision on Digital Privacy",
        content:
          "The Supreme Court ruled on digital privacy rights in a landmark case that affects how law enforcement can access digital communications...",
        source: "Google Scholar",
        url: "https://scholar.google.com/scholar_case?case=123456789",
        court: "U.S. Supreme Court",
        date: "2024-01-15",
        jurisdiction: "Federal",
        documentType: "Court Opinion",
        relevanceScore: 0.95,
      },
      {
        id: "live-2",
        title: "Federal Circuit Court Ruling on Contract Interpretation",
        content: "The Federal Circuit provided guidance on contract interpretation standards in commercial disputes...",
        source: "Justia",
        url: "https://law.justia.com/cases/federal/circuit-courts/",
        court: "Federal Circuit",
        date: "2024-01-10",
        jurisdiction: "Federal",
        documentType: "Court Opinion",
        relevanceScore: 0.87,
      },
      {
        id: "live-3",
        title: "New Employment Law Regulations",
        content: "The Department of Labor issued new regulations affecting workplace safety and employee rights...",
        source: "CourtListener",
        url: "https://www.courtlistener.com/",
        court: "Administrative",
        date: "2024-01-08",
        jurisdiction: "Federal",
        documentType: "Regulation",
        relevanceScore: 0.82,
      },
    ]

    // Filter results based on query relevance
    const filteredResults = mockResults
      .filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.content.toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, limit)

    return NextResponse.json({
      query,
      results: filteredResults,
      totalFound: filteredResults.length,
      searchType: "live_sources",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Live search error:", error)
    return NextResponse.json(
      {
        error: "Live search failed",
        message: error instanceof Error ? error.message : "Unknown error",
        results: [],
      },
      { status: 500 },
    )
  }
}
