import { NextResponse } from "next/server"
import { executeRawQuery } from "@/lib/db"

export async function GET() {
  try {
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `

    const tables = await executeRawQuery(tablesQuery)

    // Get counts from key tables if they exist
    let counts = {}

    const tableNames = tables.map((t: any) => t.table_name)

    if (tableNames.includes("jurisdictions")) {
      const jurisdictionsCount = await executeRawQuery("SELECT COUNT(*) as count FROM jurisdictions")
      counts = { ...counts, jurisdictions: jurisdictionsCount[0].count }
    }

    if (tableNames.includes("practice_areas")) {
      const practiceAreasCount = await executeRawQuery("SELECT COUNT(*) as count FROM practice_areas")
      counts = { ...counts, practiceAreas: practiceAreasCount[0].count }
    }

    if (tableNames.includes("document_types")) {
      const documentTypesCount = await executeRawQuery("SELECT COUNT(*) as count FROM document_types")
      counts = { ...counts, documentTypes: documentTypesCount[0].count }
    }

    if (tableNames.includes("legal_sources")) {
      const legalSourcesCount = await executeRawQuery("SELECT COUNT(*) as count FROM legal_sources")
      counts = { ...counts, legalSources: legalSourcesCount[0].count }
    }

    return NextResponse.json({
      status: "connected",
      tables: tableNames,
      counts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database status check error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
