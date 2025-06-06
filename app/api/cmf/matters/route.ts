import { NextResponse } from "next/server"
import { cognitiveMatterFabric } from "@/lib/cmf/cognitive-matter-fabric"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const query = searchParams.get("query")

    if (query) {
      // Search matters
      const matters = await cognitiveMatterFabric.searchMatters(query, userId || undefined)
      return NextResponse.json({ matters })
    } else if (userId) {
      // Get user matters
      const matters = await cognitiveMatterFabric.getUserMatters(userId)
      return NextResponse.json({ matters })
    } else {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error fetching matters:", error)
    return NextResponse.json({ error: "Failed to fetch matters" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const matterData = await request.json()

    // Validate required fields
    const requiredFields = [
      "name",
      "matterNumber",
      "client",
      "matterType",
      "practiceArea",
      "jurisdiction",
      "leadAttorney",
    ]
    for (const field of requiredFields) {
      if (!matterData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const matterId = await cognitiveMatterFabric.createMatter(matterData)

    return NextResponse.json({
      success: true,
      matterId,
      message: "Matter created successfully",
    })
  } catch (error) {
    console.error("Error creating matter:", error)
    return NextResponse.json({ error: "Failed to create matter" }, { status: 500 })
  }
}
