import { GoogleScholarScraper } from "@/lib/legal-sources/google-scholar-scraper"
import { JustiaAPI } from "@/lib/legal-sources/justia-api"
import { CourtListenerAPI } from "@/lib/legal-sources/court-listener-api"
import { searchLegalDocuments } from "@/lib/database"

export interface SearchOptions {
  jurisdiction?: string
  practiceArea?: string
  documentType?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  sources?: string[]
}

export interface SearchResult {
  id: string
  title: string
  content: string
  citation?: string
  court?: string
  date?: string
  url?: string
  source: string
  jurisdiction?: string
  practiceArea?: string
  documentType?: string
  similarity?: number
  metadata?: any
}

export class LegalSearchService {
  private googleScholar: GoogleScholarScraper
  private justia: JustiaAPI
  private courtListener: CourtListenerAPI

  constructor() {
    this.googleScholar = new GoogleScholarScraper()
    this.justia = new JustiaAPI()
    this.courtListener = new CourtListenerAPI()
  }

  async searchAllSources(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { sources = ["internal", "google_scholar", "justia", "court_listener"], limit = 20 } = options
    const results: SearchResult[] = []

    // Search internal database first
    if (sources.includes("internal")) {
      try {
        const internalResults = await this.searchInternalDatabase(query, options)
        results.push(...internalResults)
      } catch (error) {
        console.error("Internal database search error:", error)
      }
    }

    // Search Google Scholar (live)
    if (sources.includes("google_scholar")) {
      try {
        const scholarResults = await this.searchGoogleScholarLive(query, options)
        results.push(...scholarResults)
      } catch (error) {
        console.error("Google Scholar search error:", error)
      }
    }

    // Search Justia (live)
    if (sources.includes("justia")) {
      try {
        const justiaResults = await this.searchJustiaLive(query, options)
        results.push(...justiaResults)
      } catch (error) {
        console.error("Justia search error:", error)
      }
    }

    // Search CourtListener (live)
    if (sources.includes("court_listener")) {
      try {
        const courtResults = await this.searchCourtListenerLive(query, options)
        results.push(...courtResults)
      } catch (error) {
        console.error("CourtListener search error:", error)
      }
    }

    // Deduplicate and rank results
    return this.deduplicateAndRank(results, query).slice(0, limit)
  }

  private async searchInternalDatabase(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const dbResults = await searchLegalDocuments({
      query,
      jurisdiction: options.jurisdiction,
      practiceArea: options.practiceArea,
      documentType: options.documentType,
      limit: options.limit || 10,
    })

    return dbResults.map((result: any) => ({
      id: `internal-${result.id}`,
      title: result.title,
      content: result.content || result.summary || "",
      citation: result.citations?.[0],
      date: result.publication_date,
      url: result.source_url,
      source: "Internal Database",
      jurisdiction: result.jurisdiction_code,
      practiceArea: result.practice_area_code,
      documentType: result.document_type,
      metadata: {
        keyTerms: result.key_terms,
        citations: result.citations,
        summary: result.summary,
      },
    }))
  }

  private async searchGoogleScholarLive(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // This would use the actual Google Scholar scraper for live results
    const mockResults = [
      {
        id: "live-scholar-1",
        title: "Recent Constitutional Law Decision",
        content: "Live search result from Google Scholar...",
        citation: "2024 U.S. LEXIS 123",
        court: "U.S. District Court",
        date: "2024-01-15",
        url: "https://scholar.google.com/scholar_case?case=123456789",
        source: "Google Scholar (Live)",
        jurisdiction: "US",
        documentType: "FED_COURT",
        metadata: { live: true },
      },
    ]

    return mockResults
  }

  private async searchJustiaLive(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // Use the live search method from JustiaAPI
    return await this.justia.searchLive(query, options)
  }

  private async searchCourtListenerLive(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // Use the live search method from CourtListenerAPI
    return await this.courtListener.searchLive(query, options)
  }

  private deduplicateAndRank(results: SearchResult[], query: string): SearchResult[] {
    // Simple deduplication by title similarity
    const uniqueResults: SearchResult[] = []
    const seenTitles = new Set<string>()

    for (const result of results) {
      const normalizedTitle = result.title.toLowerCase().replace(/[^\w\s]/g, "")
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle)

        // Calculate relevance score
        result.similarity = this.calculateRelevanceScore(result, query)
        uniqueResults.push(result)
      }
    }

    // Sort by relevance score
    return uniqueResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
  }

  private calculateRelevanceScore(result: SearchResult, query: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/)
    const titleText = result.title.toLowerCase()
    const contentText = result.content.toLowerCase()

    let score = 0

    // Title matches are worth more
    for (const term of queryTerms) {
      if (titleText.includes(term)) score += 3
      if (contentText.includes(term)) score += 1
    }

    // Boost recent documents
    if (result.date) {
      const date = new Date(result.date)
      const now = new Date()
      const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff < 365) score += 1 // Boost documents from last year
    }

    // Boost certain sources
    if (result.source === "Internal Database") score += 2
    if (result.citation) score += 1

    return score
  }

  async searchByJurisdiction(jurisdiction: string, limit = 10): Promise<SearchResult[]> {
    return this.searchAllSources("", { jurisdiction, limit })
  }

  async searchByPracticeArea(practiceArea: string, limit = 10): Promise<SearchResult[]> {
    return this.searchAllSources("", { practiceArea, limit })
  }

  async searchRecentCases(days = 30, limit = 10): Promise<SearchResult[]> {
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    return this.searchAllSources("", {
      dateFrom: dateFrom.toISOString().split("T")[0],
      limit,
    })
  }
}
