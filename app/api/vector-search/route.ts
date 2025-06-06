import { NextResponse } from "next/server"
import { vectorClient } from "@/lib/database/vector-client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query, filter, topK } = body

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Search by text query
    const results = await vectorClient.search(query, {
      topK: topK || 10,
      filter: filter || {},
    })

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    })
  } catch (error) {
    console.error("Vector search error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
