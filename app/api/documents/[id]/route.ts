import { NextResponse } from "next/server"
import { get } from "@vercel/blob"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // In a real app, you would fetch document metadata from your database
    // and then use that to get the blob

    // For now, we'll assume the id is the pathname in the blob store
    const blob = await get(`documents/${id}`)

    if (!blob) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // In a real app, you would fetch additional metadata from your database
    const document = {
      id,
      name: id.split("/").pop() || "Unnamed Document",
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      type: getDocumentType(id),
      status: "review",
      risk: getRandomRisk(),
      issues: Math.floor(Math.random() * 10),
      analysis: {
        summary: "This document contains standard legal language with some potential risks identified.",
        keyTerms: ["confidentiality", "liability", "termination"],
        recommendations: [
          "Review liability clauses",
          "Clarify termination conditions",
          "Strengthen confidentiality provisions",
        ],
      },
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 })
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
