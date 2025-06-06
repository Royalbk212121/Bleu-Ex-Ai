import { NextResponse } from "next/server"
import { legalDataIngestionService } from "@/lib/data-pipeline/legal-data-ingestion"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { source, bucket, key, url, metadata } = body

    if (!source) {
      return NextResponse.json({ error: "Source is required" }, { status: 400 })
    }

    let documentId: string

    if (source === "s3") {
      if (!bucket || !key) {
        return NextResponse.json({ error: "Bucket and key are required for S3 source" }, { status: 400 })
      }
      documentId = await legalDataIngestionService.processS3Document(bucket, key)
    } else if (source === "url") {
      if (!url) {
        return NextResponse.json({ error: "URL is required for URL source" }, { status: 400 })
      }
      documentId = await legalDataIngestionService.processUrlDocument(url, metadata)
    } else {
      return NextResponse.json({ error: "Invalid source type" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      documentId,
      message: "Document ingested successfully",
    })
  } catch (error) {
    console.error("Data ingestion error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
