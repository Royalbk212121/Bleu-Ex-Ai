import { NextResponse } from "next/server"
import { GoogleScholarAPI } from "@/lib/legal-sources/google-scholar"
import { JustiaAPI } from "@/lib/legal-sources/justia"
import { CourtListenerAPI } from "@/lib/legal-sources/court-listener"

export async function POST(request: Request) {
  try {
    const { source, documents } = await request.json()

    if (!source || !documents || !Array.isArray(documents)) {
      return NextResponse.json(
        {
          error: "Source and documents array are required",
        },
        { status: 400 },
      )
    }

    const importedDocuments = []
    let api

    // Initialize the appropriate API
    switch (source) {
      case "google_scholar":
        api = new GoogleScholarAPI()
        break
      case "justia":
        api = new JustiaAPI()
        break
      case "court_listener":
        api = new CourtListenerAPI()
        break
      default:
        return NextResponse.json(
          {
            error: "Unsupported source",
          },
          { status: 400 },
        )
    }

    // Import each document
    for (const document of documents) {
      try {
        const documentId = await api.importDocument(document)
        importedDocuments.push({
          sourceId: document.id || document.title,
          documentId,
          title: document.title,
          status: "imported",
        })
      } catch (error) {
        console.error(`Failed to import document ${document.title}:`, error)
        importedDocuments.push({
          sourceId: document.id || document.title,
          title: document.title,
          status: "failed",
          error: error.message,
        })
      }
    }

    const successCount = importedDocuments.filter((d) => d.status === "imported").length
    const failureCount = importedDocuments.filter((d) => d.status === "failed").length

    return NextResponse.json({
      success: true,
      imported: successCount,
      failed: failureCount,
      documents: importedDocuments,
    })
  } catch (error) {
    console.error("Legal sources import error:", error)
    return NextResponse.json({ error: "Import failed" }, { status: 500 })
  }
}
