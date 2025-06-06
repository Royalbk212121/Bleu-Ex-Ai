import { put, list } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Test if we can access the blob store
    const { blobs } = await list()

    return NextResponse.json({
      success: true,
      message: "Blob storage is properly configured",
      blobCount: blobs.length,
      token: process.env.BLOB_READ_WRITE_TOKEN ? "✅ Configured" : "❌ Missing",
    })
  } catch (error) {
    console.error("Blob test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        token: process.env.BLOB_READ_WRITE_TOKEN ? "✅ Configured" : "❌ Missing",
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    // Test upload with a small test file
    const testContent = "This is a test file to verify Blob storage is working."
    const testFile = new File([testContent], "test.txt", { type: "text/plain" })

    const blob = await put("test-file.txt", testFile, {
      access: "public",
      addRandomSuffix: true,
    })

    return NextResponse.json({
      success: true,
      message: "Test upload successful",
      url: blob.url,
      size: blob.size,
    })
  } catch (error) {
    console.error("Blob upload test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
