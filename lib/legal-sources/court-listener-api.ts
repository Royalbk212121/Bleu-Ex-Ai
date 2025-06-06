import { insertLegalDocument } from "@/lib/database"

export class CourtListenerAPI {
  private baseUrl = "https://www.courtlistener.com/api/rest/v3"
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.COURT_LISTENER_API_KEY
  }

  async searchLive(query: string, options: any = {}) {
    try {
      if (this.apiKey) {
        return await this.performAPISearch(query, options)
      } else {
        console.log("CourtListener: No API key found, using fallback search")
        return await this.fallbackSearch(query, options)
      }
    } catch (error) {
      console.error("CourtListener live search error:", error)
      return await this.fallbackSearch(query, options)
    }
  }

  private async performAPISearch(query: string, options: any) {
    const searchParams = new URLSearchParams({
      q: query,
      type: "o", // opinions
      order_by: "score desc",
      format: "json",
    })

    if (options.limit) {
      searchParams.append("page_size", options.limit.toString())
    }

    const response = await fetch(`${this.baseUrl}/search/?${searchParams}`, {
      headers: {
        Authorization: `Token ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`CourtListener API error: ${response.status}`)
    }

    const data = await response.json()
    return this.formatAPIResults(data.results || [])
  }

  private async fallbackSearch(query: string, options: any) {
    // Curated federal court opinions
    const curatedResults = [
      {
        id: "united-states-v-nixon-1974",
        title: "United States v. Nixon",
        citation: "418 U.S. 683 (1974)",
        court: "Supreme Court of the United States",
        date_filed: "1974-07-24",
        url: "https://www.courtlistener.com/opinion/108713/united-states-v-nixon/",
        snippet:
          "The President's claim of executive privilege must yield to the demonstrated, specific need for evidence in a pending criminal trial.",
        jurisdiction: "US",
        practiceArea: "CONST",
        documentType: "SCOTUS",
      },
      {
        id: "gideon-v-wainwright-1963",
        title: "Gideon v. Wainwright",
        citation: "372 U.S. 335 (1963)",
        court: "Supreme Court of the United States",
        date_filed: "1963-03-18",
        url: "https://www.courtlistener.com/opinion/106288/gideon-v-wainwright/",
        snippet:
          "The right of an indigent defendant in a criminal trial to have the assistance of counsel is a fundamental right essential to a fair trial.",
        jurisdiction: "US",
        practiceArea: "CRIM",
        documentType: "SCOTUS",
      },
    ]

    // Filter based on query
    const filteredResults = curatedResults.filter(
      (result) =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.snippet.toLowerCase().includes(query.toLowerCase()),
    )

    return this.formatResults(filteredResults, "CourtListener")
  }

  private formatAPIResults(results: any[]) {
    return results.map((result: any) => ({
      id: `court-listener-${result.id}`,
      title: result.caseName || result.case_name,
      content: result.snippet || result.text || "",
      citation: result.citation?.neutral_cite || result.citation,
      court: result.court,
      date: result.dateFiled || result.date_filed,
      url: result.absolute_url,
      source: "CourtListener",
      jurisdiction: "US",
      practiceArea: "GENERAL",
      documentType: "FED_COURT",
      metadata: result,
    }))
  }

  private formatResults(results: any[], source: string) {
    return results.map((result: any) => ({
      id: `court-listener-${result.id}`,
      title: result.title,
      content: result.snippet || "",
      citation: result.citation,
      court: result.court,
      date: result.date_filed,
      url: result.url,
      source,
      jurisdiction: result.jurisdiction,
      practiceArea: result.practiceArea,
      documentType: result.documentType,
      metadata: result,
    }))
  }

  async testConnection() {
    try {
      const testResults = await this.searchLive("constitutional law", { limit: 1 })
      const hasApiKey = !!this.apiKey

      return {
        status: testResults.length > 0 ? (hasApiKey ? "online" : "limited") : "offline",
        message: hasApiKey ? "Connected with API key" : "Limited functionality (no API key)",
        resultCount: testResults.length,
      }
    } catch (error) {
      return {
        status: "offline",
        message: error.message,
        resultCount: 0,
      }
    }
  }

  async searchAndDownload(query: string, options: any = {}) {
    try {
      const results = await this.searchLive(query, options)
      const downloadedDocuments = []

      for (const result of results.slice(0, options.limit || 5)) {
        try {
          const documentContent = await this.extractDocumentContent(result)
          const documentId = await this.saveToDatabase(documentContent)
          downloadedDocuments.push({
            sourceId: result.id,
            documentId,
            title: result.title,
            status: "downloaded",
          })
        } catch (error) {
          console.error(`Failed to download document ${result.title}:`, error)
          downloadedDocuments.push({
            sourceId: result.id,
            title: result.title,
            status: "failed",
            error: error.message,
          })
        }
      }

      return downloadedDocuments
    } catch (error) {
      console.error("CourtListener search and download error:", error)
      throw error
    }
  }

  private async extractDocumentContent(result: any) {
    return {
      title: result.title,
      content: result.content || result.snippet,
      citation: result.citation,
      court: result.court,
      date: result.date,
      url: result.url,
      jurisdiction: result.jurisdiction || "US",
      practiceArea: result.practiceArea || "GENERAL",
      documentType: result.documentType || "FED_COURT",
      source: "COURT_LISTENER",
      metadata: {
        courtListenerId: result.id,
        snippet: result.snippet,
        extractedAt: new Date().toISOString(),
      },
    }
  }

  private async saveToDatabase(documentContent: any) {
    return await insertLegalDocument({
      title: documentContent.title,
      content: documentContent.content,
      documentTypeCode: documentContent.documentType,
      jurisdictionCode: documentContent.jurisdiction,
      practiceAreaCode: documentContent.practiceArea,
      source: documentContent.source,
      sourceUrl: documentContent.url,
      metadata: {
        ...documentContent.metadata,
        citation: documentContent.citation,
        court: documentContent.court,
        date: documentContent.date,
      },
    })
  }

  async getDockets(court?: string, limit = 20) {
    try {
      if (!this.apiKey) {
        throw new Error("API key required for docket access")
      }

      const searchParams = new URLSearchParams({
        format: "json",
        page_size: limit.toString(),
      })

      if (court) {
        searchParams.append("court", court)
      }

      const response = await fetch(`${this.baseUrl}/dockets/?${searchParams}`, {
        headers: {
          Authorization: `Token ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`CourtListener dockets API error: ${response.status}`)
      }

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error("Error fetching CourtListener dockets:", error)
      // Return mock dockets for demo
      return [
        {
          id: "docket-123",
          case_name: "Apple Inc. v. Samsung Electronics Co.",
          docket_number: "11-cv-01846",
          court: "N.D. Cal.",
          date_filed: "2011-04-15",
          nature_of_suit: "Patent",
          jurisdiction_type: "Federal Question",
        },
      ]
    }
  }
}
