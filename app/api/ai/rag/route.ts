import { NextResponse } from "next/server"
import { ragService } from "@/lib/ai/rag-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query, context, options = {}, stream = false } = body

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    if (stream) {
      // Handle streaming RAG response
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const ragStream = ragService.streamQuery({ query, context, options })

            for await (const chunk of ragStream) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
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
      // Handle regular RAG response
      const result = await ragService.processQuery({ query, context, options })

      return NextResponse.json({
        success: true,
        result,
      })
    }
  } catch (error) {
    console.error("RAG API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
