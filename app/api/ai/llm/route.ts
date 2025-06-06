import { NextResponse } from "next/server"
import { llmService } from "@/lib/ai/llm-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages, model, temperature, maxTokens, stream = false } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    if (stream) {
      // Handle streaming response
      const textStream = await llmService.streamText({
        messages,
        model,
        temperature,
        maxTokens,
      })

      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of textStream) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"))
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    } else {
      // Handle regular response
      const result = await llmService.generateText({
        messages,
        model,
        temperature,
        maxTokens,
      })

      return NextResponse.json({
        success: true,
        result,
      })
    }
  } catch (error) {
    console.error("LLM API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
