import { NextResponse } from "next/server"
import { ArbiterNet } from "@/lib/arbiternet"

export async function POST(request: Request) {
  try {
    const { sessionId, userRequest, context } = await request.json()

    if (!sessionId || !userRequest) {
      return NextResponse.json({ error: "Missing required fields: sessionId, userRequest" }, { status: 400 })
    }

    const arbiterNet = new ArbiterNet()
    const result = await arbiterNet.processRequest(sessionId, userRequest, context || {})

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error processing agent request:", error)
    return NextResponse.json(
      {
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
