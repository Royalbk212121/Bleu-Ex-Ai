import { NextResponse } from "next/server"
import { cognitiveMatterFabric } from "@/lib/cmf/cognitive-matter-fabric"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const matterId = params.id
    const context = await cognitiveMatterFabric.getMatterContext(matterId)

    const matter = context.getMatter()
    if (!matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 })
    }

    const entities = context.getEntities()
    const relationships = context.getRelationships()
    const documents = context.getDocuments()
    const riskAssessment = context.getRiskAssessment()
    const insights = context.getInsights()

    return NextResponse.json({
      matter,
      entities,
      relationships,
      documents,
      riskAssessment,
      insights,
      context: context.getMatterContext(),
    })
  } catch (error) {
    console.error("Error fetching matter:", error)
    return NextResponse.json({ error: "Failed to fetch matter" }, { status: 500 })
  }
}
