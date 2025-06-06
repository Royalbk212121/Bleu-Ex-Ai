import { NextResponse } from "next/server"
import { list } from "@vercel/blob"

export async function GET() {
  try {
    // List all documents in the blob store
    const { blobs } = await list()

    // Transform blob data into document metadata
    const documents = blobs.map((blob) => {
      // In a real app, you would fetch additional metadata from your database
      return {
        id: blob.pathname.split("/").pop()?.split(".")[0] || blob.pathname,
        name: blob.pathname.split("/").pop() || "Unnamed Document",
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        type: getDocumentType(blob.pathname),
        status: "review",
        risk: getRandomRisk(),
        issues: Math.floor(Math.random() * 10),
      }
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

// Helper functions
function getDocumentType(pathname: string) {
  const extension = pathname.split(".").pop()?.toLowerCase()

  if (extension === "pdf") return "pdf"
  if (extension === "docx" || extension === "doc") return "word"
  if (extension === "txt") return "text"

  return "unknown"
}

function getRandomRisk() {
  const risks = ["low", "medium", "high"]
  return risks[Math.floor(Math.random() * risks.length)]
}
