import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 5 } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    console.log("Enhanced search query:", query)

    // Try to search in the database first
    try {
      const results = await performDatabaseSearch(query, limit)
      if (results.length > 0) {
        return NextResponse.json({
          results,
          source: "database",
          query,
          total: results.length,
        })
      }
    } catch (dbError) {
      console.log("Database search failed, using fallback:", dbError)
    }

    // Fallback to mock data if database search fails
    const mockResults = getMockSearchResults(query, limit)

    return NextResponse.json({
      results: mockResults,
      source: "mock",
      query,
      total: mockResults.length,
    })
  } catch (error) {
    console.error("Enhanced search error:", error)
    return NextResponse.json(
      {
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function performDatabaseSearch(query: string, limit: number) {
  // Use text search with PostgreSQL full-text search
  const { data, error } = await supabaseAdmin
    .from("legal_documents")
    .select(
      `
      id,
      title,
      content,
      summary,
      document_type,
      jurisdiction,
      practice_area,
      source,
      source_url,
      citations,
      key_terms,
      created_at
    `,
    )
    .textSearch("content", query, {
      type: "websearch",
      config: "english",
    })
    .limit(limit)

  if (error) {
    throw new Error(`Supabase search error: ${error.message}`)
  }

  return (
    data?.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content?.substring(0, 500) + "...",
      summary: doc.summary,
      type: doc.document_type,
      jurisdiction: doc.jurisdiction,
      practiceArea: doc.practice_area,
      source: doc.source,
      url: doc.source_url,
      citations: doc.citations || [],
      keyTerms: doc.key_terms || [],
      relevanceScore: 0.85,
      createdAt: doc.created_at,
    })) || []
  )
}

function getMockSearchResults(query: string, limit: number) {
  const mockData = [
    {
      id: "mock-1",
      title: "Contract Law Fundamentals",
      content: `A contract is a legally binding agreement between two or more parties. The essential elements include offer, acceptance, consideration, and mutual assent. Key principles include formation requirements, performance obligations, and breach remedies...`,
      summary: "Comprehensive overview of basic contract law principles and requirements",
      type: "Legal Guide",
      jurisdiction: "Federal",
      practiceArea: "Contract Law",
      source: "Legal Database",
      url: "https://example.com/contract-law",
      citations: ["UCC § 2-201", "Restatement (Second) of Contracts § 1"],
      keyTerms: ["contract", "offer", "acceptance", "consideration"],
      relevanceScore: 0.92,
      createdAt: new Date().toISOString(),
    },
    {
      id: "mock-2",
      title: "Tort Law Principles",
      content: `Tort law governs civil wrongs and provides remedies for harm caused by wrongful acts. Main categories include intentional torts, negligence, and strict liability. Each category has specific elements and defenses...`,
      summary: "Overview of tort law categories and legal principles",
      type: "Legal Guide",
      jurisdiction: "Federal",
      practiceArea: "Tort Law",
      source: "Legal Database",
      url: "https://example.com/tort-law",
      citations: ["Restatement (Third) of Torts § 1", "Palsgraf v. Long Island R.R. Co."],
      keyTerms: ["tort", "negligence", "liability", "damages"],
      relevanceScore: 0.88,
      createdAt: new Date().toISOString(),
    },
    {
      id: "mock-3",
      title: "Constitutional Law Overview",
      content: `Constitutional law encompasses interpretation of the U.S. Constitution, covering fundamental rights, separation of powers, federalism, and judicial review. Key principles include due process, equal protection, and constitutional interpretation...`,
      summary: "Introduction to constitutional law principles and structure",
      type: "Legal Guide",
      jurisdiction: "Federal",
      practiceArea: "Constitutional Law",
      source: "Legal Database",
      url: "https://example.com/constitutional-law",
      citations: ["U.S. Const. art. I", "Marbury v. Madison", "Brown v. Board of Education"],
      keyTerms: ["constitution", "rights", "federalism", "judicial review"],
      relevanceScore: 0.85,
      createdAt: new Date().toISOString(),
    },
    {
      id: "mock-4",
      title: "Corporate Law Essentials",
      content: `Corporate law governs formation, operation, and dissolution of corporations. Covers corporate governance, fiduciary duties, shareholder rights, and compliance requirements. Essential for business operations and legal compliance...`,
      summary: "Essential principles of corporate law and governance",
      type: "Legal Guide",
      jurisdiction: "Federal",
      practiceArea: "Corporate Law",
      source: "Legal Database",
      url: "https://example.com/corporate-law",
      citations: ["Delaware General Corporation Law", "Model Business Corporation Act"],
      keyTerms: ["corporation", "governance", "fiduciary duty", "shareholders"],
      relevanceScore: 0.82,
      createdAt: new Date().toISOString(),
    },
    {
      id: "mock-5",
      title: "Intellectual Property Law Guide",
      content: `IP law protects creations of the mind including patents, trademarks, copyrights, and trade secrets. Each type has specific requirements, duration, and enforcement mechanisms. Critical for protecting business assets...`,
      summary: "Comprehensive guide to intellectual property law and protection",
      type: "Legal Guide",
      jurisdiction: "Federal",
      practiceArea: "Intellectual Property",
      source: "Legal Database",
      url: "https://example.com/ip-law",
      citations: ["35 U.S.C. § 101", "15 U.S.C. § 1051", "17 U.S.C. § 102"],
      keyTerms: ["patent", "trademark", "copyright", "trade secret"],
      relevanceScore: 0.79,
      createdAt: new Date().toISOString(),
    },
  ]

  // Filter results based on query relevance
  const queryLower = query.toLowerCase()
  const filteredResults = mockData.filter(
    (item) =>
      item.title.toLowerCase().includes(queryLower) ||
      item.content.toLowerCase().includes(queryLower) ||
      item.keyTerms.some((term) => term.toLowerCase().includes(queryLower)) ||
      item.practiceArea.toLowerCase().includes(queryLower),
  )

  return filteredResults.slice(0, limit)
}
