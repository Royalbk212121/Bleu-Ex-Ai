import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "image/jpeg",
      "image/png",
      "image/gif",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 50MB.`,
        },
        { status: 400 },
      )
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    // Create document metadata
    const documentMetadata = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: blob.url,
      uploadedAt: new Date().toISOString(),
      status: "uploaded",
      analysisStatus: "pending",
    }

    console.log("Document uploaded successfully:", {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      url: blob.url,
    })

    return NextResponse.json({
      success: true,
      document: documentMetadata,
      blobUrl: blob.url,
    })
  } catch (error) {
    console.error("Upload error:", error)

    if (error instanceof Error) {
      // Handle specific Vercel Blob errors
      if (error.message.includes("BLOB_READ_WRITE_TOKEN")) {
        return NextResponse.json(
          {
            error: "Blob storage configuration error. Please check your token.",
          },
          { status: 500 },
        )
      }

      if (error.message.includes("size")) {
        return NextResponse.json(
          {
            error: "File size exceeds the allowed limit.",
          },
          { status: 413 },
        )
      }

      return NextResponse.json(
        {
          error: `Upload failed: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "An unexpected error occurred during upload",
      },
      { status: 500 },
    )
  }
}
