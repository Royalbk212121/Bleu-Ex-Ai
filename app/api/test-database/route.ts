import { NextResponse } from "next/server"
import { executeRawQuery } from "@/lib/db"

export async function GET() {
  try {
    // Test basic database connection
    const result = await executeRawQuery("SELECT NOW() as current_time, version() as postgres_version")

    // Check if our legal tables exist
    const tables = await executeRawQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('legal_documents', 'jurisdictions', 'practice_areas', 'document_types', 'document_embeddings')
      ORDER BY table_name
    `)

    // Check if vector extension is available
    let vectorExtension = false
    try {
      await executeRawQuery("SELECT 1 FROM pg_extension WHERE extname = 'vector'")
      vectorExtension = true
    } catch (error) {
      console.log("Vector extension not found")
    }

    // Get sample data counts if tables exist
    let counts = {}
    const tableNames = tables.map((t: any) => t.table_name)

    if (tableNames.includes("jurisdictions")) {
      const jurisdictionCount = await executeRawQuery("SELECT COUNT(*) as count FROM jurisdictions")
      counts = { ...counts, jurisdictions: jurisdictionCount[0].count }
    }

    if (tableNames.includes("legal_documents")) {
      const documentsCount = await executeRawQuery("SELECT COUNT(*) as count FROM legal_documents")
      counts = { ...counts, legal_documents: documentsCount[0].count }
    }

    if (tableNames.includes("document_embeddings")) {
      const embeddingsCount = await executeRawQuery("SELECT COUNT(*) as count FROM document_embeddings")
      counts = { ...counts, document_embeddings: embeddingsCount[0].count }
    }

    return NextResponse.json({
      status: "connected",
      database_time: result[0].current_time,
      postgres_version: result[0].postgres_version,
      legal_tables: tableNames,
      vector_extension: vectorExtension,
      record_counts: counts,
      neon_integration: "active",
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        suggestion: "Database may need initialization or vector extension setup",
      },
      { status: 500 },
    )
  }
}
