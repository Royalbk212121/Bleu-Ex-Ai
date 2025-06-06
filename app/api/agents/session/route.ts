import { NextResponse } from "next/server"
import { ArbiterNet } from "@/lib/arbiternet"

export async function POST(request: Request) {
  try {
    const { userId, sessionName, sessionType, context } = await request.json()

    if (!userId || !sessionName || !sessionType) {
      return NextResponse.json({ error: "Missing required fields: userId, sessionName, sessionType" }, { status: 400 })
    }

    const arbiterNet = new ArbiterNet()
    const sessionId = await arbiterNet.createSession(userId, sessionName, sessionType, context || {})

    return NextResponse.json({
      success: true,
      sessionId,
      message: "Agent session created successfully",
    })
  } catch (error) {
    console.error("Error creating agent session:", error)
    return NextResponse.json(
      {
        error: "Failed to create agent session",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
