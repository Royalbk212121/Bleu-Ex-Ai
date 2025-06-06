import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 })
    }

    // Simulate AI analysis - in production, this would call your AI service
    const analysis = [
      {
        type: "suggestion",
        text: "Consider adding a force majeure clause to protect against unforeseen circumstances.",
        position: 0,
        severity: "medium",
        category: "Contract Terms",
      },
      {
        type: "improvement",
        text: 'The term "reasonable time" is vague. Consider specifying exact timeframes.',
        position: 100,
        severity: "high",
        category: "Clarity",
      },
      {
        type: "error",
        text: "Potential inconsistency in jurisdiction clauses found.",
        position: 200,
        severity: "high",
        category: "Legal Risk",
      },
    ]

    return NextResponse.json({
      success: true,
      analysis,
      wordCount: content.split(" ").length,
      characterCount: content.length,
    })
  } catch (error) {
    console.error("Word add-in analysis error:", error)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
