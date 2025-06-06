import { NextResponse } from "next/server"
import { documentStorageClient } from "@/lib/database/document-storage"

export async function POST() {
  try {
    await documentStorageClient.initialize()

    return NextResponse.json({
      success: true,
      message: "Document storage initialized successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Document storage initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
