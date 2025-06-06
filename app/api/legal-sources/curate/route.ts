import { NextResponse } from "next/server"
import { executeRawQuery } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { action = "analyze" } = await request.json()

    if (action === "analyze") {
      // Analyze the current database for curation opportunities
      const analysis = await analyzeLegalDatabase()
      return NextResponse.json(analysis)
    }

    if (action === "curate") {
      // Perform curation tasks
      const curationResults = await performCuration()
      return NextResponse.json(curationResults)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Curation error:", error)
    return NextResponse.json({ error: "Curation failed" }, { status: 500 })
  }
}

async function analyzeLegalDatabase() {
  try {
    // Get document counts by source
    const sourceStats = await executeRawQuery(`
      SELECT 
        source,
        COUNT(*) as document_count,
        COUNT(DISTINCT CASE WHEN dt.category = 'case_law' THEN ld.id END) as case_count,
        COUNT(DISTINCT CASE WHEN dt.category = 'statute' THEN ld.id END) as statute_count,
        COUNT(DISTINCT CASE WHEN dt.category = 'regulation' THEN ld.id END) as regulation_count
      FROM legal_documents ld
      LEFT JOIN document_types dt ON ld.document_type_id = dt.id
      GROUP BY source
      ORDER BY document_count DESC
    `)

    // Get jurisdiction distribution
    const jurisdictionStats = await executeRawQuery(`
      SELECT 
        j.name as jurisdiction,
        j.code,
        COUNT(ld.id) as document_count
      FROM legal_documents ld
      LEFT JOIN jurisdictions j ON ld.jurisdiction_id = j.id
      WHERE j.name IS NOT NULL
      GROUP BY j.name, j.code
      ORDER BY document_count DESC
    `)

    // Get practice area distribution
    const practiceAreaStats = await executeRawQuery(`
      SELECT 
        pa.name as practice_area,
        pa.code,
        COUNT(ld.id) as document_count
      FROM legal_documents ld
      LEFT JOIN practice_areas pa ON ld.practice_area_id = pa.id
      WHERE pa.name IS NOT NULL
      GROUP BY pa.name, pa.code
      ORDER BY document_count DESC
    `)

    // Identify duplicates
    const duplicates = await executeRawQuery(`
      SELECT 
        title,
        COUNT(*) as duplicate_count,
        array_agg(id) as document_ids,
        array_agg(source) as sources
      FROM legal_documents
      GROUP BY title
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
      LIMIT 50
    `)

    // Find documents missing key metadata
    const missingMetadata = await executeRawQuery(`
      SELECT 
        COUNT(CASE WHEN jurisdiction_id IS NULL THEN 1 END) as missing_jurisdiction,
        COUNT(CASE WHEN practice_area_id IS NULL THEN 1 END) as missing_practice_area,
        COUNT(CASE WHEN document_type_id IS NULL THEN 1 END) as missing_document_type,
        COUNT(CASE WHEN key_terms IS NULL OR array_length(key_terms, 1) IS NULL THEN 1 END) as missing_key_terms,
        COUNT(CASE WHEN citations IS NULL OR array_length(citations, 1) IS NULL THEN 1 END) as missing_citations
      FROM legal_documents
    `)

    return {
      summary: {
        totalDocuments: sourceStats.reduce((sum: number, stat: any) => sum + Number.parseInt(stat.document_count), 0),
        totalSources: sourceStats.length,
        totalJurisdictions: jurisdictionStats.length,
        totalPracticeAreas: practiceAreaStats.length,
        duplicateGroups: duplicates.length,
      },
      sourceDistribution: sourceStats,
      jurisdictionDistribution: jurisdictionStats,
      practiceAreaDistribution: practiceAreaStats,
      duplicates: duplicates.slice(0, 10), // Top 10 duplicate groups
      dataQuality: missingMetadata[0],
      recommendations: generateCurationRecommendations(sourceStats, duplicates, missingMetadata[0]),
    }
  } catch (error) {
    console.error("Database analysis error:", error)
    throw error
  }
}

async function performCuration() {
  try {
    const results = {
      duplicatesRemoved: 0,
      metadataEnhanced: 0,
      keyTermsExtracted: 0,
      citationsExtracted: 0,
      errors: [],
    }

    // Remove duplicates (keep the one with most complete metadata)
    const duplicateGroups = await executeRawQuery(`
      SELECT 
        title,
        array_agg(id ORDER BY 
          CASE WHEN jurisdiction_id IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN practice_area_id IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN key_terms IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN citations IS NOT NULL THEN 1 ELSE 0 END DESC
        ) as document_ids
      FROM legal_documents
      GROUP BY title
      HAVING COUNT(*) > 1
    `)

    for (const group of duplicateGroups) {
      try {
        const idsToDelete = group.document_ids.slice(1) // Keep first (best) document
        if (idsToDelete.length > 0) {
          await executeRawQuery(`DELETE FROM legal_documents WHERE id = ANY($1)`, [idsToDelete])
          results.duplicatesRemoved += idsToDelete.length
        }
      } catch (error) {
        results.errors.push(`Failed to remove duplicates for "${group.title}": ${error.message}`)
      }
    }

    // Extract key terms from content
    const documentsNeedingKeyTerms = await executeRawQuery(`
      SELECT id, title, content
      FROM legal_documents
      WHERE key_terms IS NULL OR array_length(key_terms, 1) IS NULL
      LIMIT 100
    `)

    for (const doc of documentsNeedingKeyTerms) {
      try {
        const keyTerms = extractKeyTerms(doc.content)
        await executeRawQuery(`UPDATE legal_documents SET key_terms = $1 WHERE id = $2`, [keyTerms, doc.id])
        results.keyTermsExtracted++
      } catch (error) {
        results.errors.push(`Failed to extract key terms for "${doc.title}": ${error.message}`)
      }
    }

    // Extract citations from content
    const documentsNeedingCitations = await executeRawQuery(`
      SELECT id, title, content
      FROM legal_documents
      WHERE citations IS NULL OR array_length(citations, 1) IS NULL
      LIMIT 100
    `)

    for (const doc of documentsNeedingCitations) {
      try {
        const citations = extractCitations(doc.content)
        await executeRawQuery(`UPDATE legal_documents SET citations = $1 WHERE id = $2`, [citations, doc.id])
        results.citationsExtracted++
      } catch (error) {
        results.errors.push(`Failed to extract citations for "${doc.title}": ${error.message}`)
      }
    }

    return {
      success: true,
      results,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Curation performance error:", error)
    throw error
  }
}

function generateCurationRecommendations(sourceStats: any[], duplicates: any[], dataQuality: any) {
  const recommendations = []

  if (duplicates.length > 0) {
    recommendations.push({
      type: "duplicates",
      priority: "high",
      message: `Found ${duplicates.length} groups of duplicate documents. Consider running deduplication.`,
      action: "Remove duplicates keeping the most complete version",
    })
  }

  if (dataQuality.missing_jurisdiction > 0) {
    recommendations.push({
      type: "metadata",
      priority: "medium",
      message: `${dataQuality.missing_jurisdiction} documents missing jurisdiction information.`,
      action: "Enhance metadata extraction from document content",
    })
  }

  if (dataQuality.missing_key_terms > 0) {
    recommendations.push({
      type: "indexing",
      priority: "medium",
      message: `${dataQuality.missing_key_terms} documents missing key terms.`,
      action: "Run key term extraction on document content",
    })
  }

  if (dataQuality.missing_citations > 0) {
    recommendations.push({
      type: "citations",
      priority: "low",
      message: `${dataQuality.missing_citations} documents missing citation information.`,
      action: "Extract citations from document text",
    })
  }

  return recommendations
}

function extractKeyTerms(content: string): string[] {
  if (!content) return []

  // Legal-specific key terms extraction
  const legalTerms = [
    // Constitutional terms
    "constitutional",
    "amendment",
    "due process",
    "equal protection",
    "first amendment",
    "fourth amendment",
    // Criminal law terms
    "miranda",
    "probable cause",
    "search warrant",
    "reasonable doubt",
    "guilty",
    "innocent",
    // Civil law terms
    "contract",
    "breach",
    "damages",
    "liability",
    "negligence",
    "tort",
    // Procedural terms
    "motion",
    "discovery",
    "deposition",
    "summary judgment",
    "appeal",
    "jurisdiction",
    // Evidence terms
    "evidence",
    "testimony",
    "witness",
    "hearsay",
    "privilege",
    "objection",
  ]

  const foundTerms = []
  const lowerContent = content.toLowerCase()

  for (const term of legalTerms) {
    if (lowerContent.includes(term)) {
      foundTerms.push(term)
    }
  }

  // Also extract capitalized terms that might be case names or legal concepts
  const capitalizedTerms = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
  const filteredCapitalized = capitalizedTerms
    .filter((term) => term.length > 3 && !["The", "This", "That", "Court", "State"].includes(term))
    .slice(0, 10) // Limit to 10 terms

  return [...new Set([...foundTerms, ...filteredCapitalized])]
}

function extractCitations(content: string): string[] {
  if (!content) return []

  const citationPatterns = [
    /\d+\s+U\.S\.?\s+\d+/g, // Supreme Court cases
    /\d+\s+F\.\d+d?\s+\d+/g, // Federal cases
    /\d+\s+U\.S\.C\.?\s+§?\s*\d+/g, // US Code
    /\d+\s+C\.F\.R\.?\s+§?\s*\d+/g, // Code of Federal Regulations
    /\d+\s+S\.Ct\.?\s+\d+/g, // Supreme Court Reporter
    /\d+\s+L\.Ed\.?\s+\d+/g, // Lawyers' Edition
  ]

  const citations: string[] = []
  citationPatterns.forEach((pattern) => {
    const matches = content.match(pattern)
    if (matches) citations.push(...matches)
  })

  return [...new Set(citations)] // Remove duplicates
}
