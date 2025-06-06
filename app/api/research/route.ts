import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { query, context } = await req.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const result = streamText({
      model: google("gemini-1.5-pro"),
      messages: [
        {
          role: "system",
          content: `You are a legal research assistant specialized in providing accurate legal information.
          Always cite your sources using the format [citation:X] where X is a number.
          Be thorough but concise in your explanations.
          Focus on relevant case law, statutes, and legal precedents.`,
        },
        {
          role: "user",
          content: query,
        },
      ],
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Research API error:", error)
    return NextResponse.json({ error: "Research query failed" }, { status: 500 })
  }
}
