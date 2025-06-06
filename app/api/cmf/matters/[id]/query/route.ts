import { NextResponse } from "next/server"
import { cognitiveMatterFabric } from "@/lib/cmf/cognitive-matter-fabric"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const matterId = params.id
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const context = await cognitiveMatterFabric.getMatterContext(matterId)
    const result = await context.queryKnowledgeGraph(query)

    return NextResponse.json({
      success: true,
      query,
      result,
    })
  } catch (error) {
    console.error("Error querying knowledge graph:", error)
    return NextResponse.json({ error: "Failed to query knowledge graph" }, { status: 500 })
  }
}
