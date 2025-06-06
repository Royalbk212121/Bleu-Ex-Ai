import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { messages, useRAG = true, useLiveSources = false } = await req.json()

    if (!messages || messages.length === 0) {
      return new Response("Messages are required", { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    let enhancedContext = ""
    let citations: any[] = []

    // Enhanced RAG search if enabled
    if (useRAG && lastMessage.role === "user") {
      try {
        const ragResponse = await fetch(`${req.nextUrl.origin}/api/rag/enhanced-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: lastMessage.content,
            limit: 8,
          }),
        })

        if (ragResponse.ok) {
          const ragData = await ragResponse.json()
          if (ragData.results && ragData.results.length > 0) {
            enhancedContext = formatRAGResults(ragData.results)
            citations = ragData.results.map((result: any, index: number) => ({
              id: index + 1,
              title: result.title || "Legal Document",
              source: result.source || "Legal Database",
              url: result.sourceUrl || "#",
              excerpt: result.content?.substring(0, 200) + "..." || "",
              relevanceScore: result.similarity || 0,
              sourceType: result.sourceType || "database",
            }))
          }
        } else {
          console.log("RAG search failed, continuing without enhanced context")
        }
      } catch (error) {
        console.error("RAG search error:", error)
        // Continue without RAG context
      }
    }

    // Live sources search if enabled
    if (useLiveSources && lastMessage.role === "user") {
      try {
        const liveResponse = await fetch(`${req.nextUrl.origin}/api/legal-search/live`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: lastMessage.content,
            limit: 5,
          }),
        })

        if (liveResponse.ok) {
          const liveData = await liveResponse.json()
          if (liveData.results && liveData.results.length > 0) {
            const liveContext = formatLiveResults(liveData.results)
            enhancedContext += enhancedContext ? "\n\n" + liveContext : liveContext

            const liveCitations = liveData.results.map((result: any, index: number) => ({
              id: citations.length + index + 1,
              title: result.title || "Live Legal Source",
              source: result.source || "External Source",
              url: result.url || "#",
              excerpt: result.content?.substring(0, 200) + "..." || "",
              relevanceScore: result.relevanceScore || 0,
            }))

            citations = [...citations, ...liveCitations]
          }
        }
      } catch (error) {
        console.error("Live search error:", error)
      }
    }

    const systemPrompt = `You are an expert legal research assistant with access to comprehensive legal databases and live legal sources.

IMPORTANT INSTRUCTIONS:
1. Provide accurate, well-researched legal information based on the context below
2. Always cite your sources using [Source X] format where X corresponds to the source number
3. Be thorough but concise in your explanations
4. Include relevant case law, statutes, and legal precedents when applicable
5. If the context doesn't contain sufficient information, clearly state this limitation
6. Format your responses with proper markdown for readability
7. Use professional legal language appropriate for legal education

${enhancedContext ? `LEGAL CONTEXT FROM MULTIPLE SOURCES:\n${enhancedContext}` : "No specific legal context provided for this query."}

Remember: You are helping users understand legal concepts for educational purposes. Always recommend consulting with a qualified attorney for specific legal advice.`

    const result = streamText({
      model: google("gemini-1.5-pro"),
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.1,
      maxTokens: 2000,
    })

    return result.toDataStreamResponse({
      headers: {
        "X-Citations": JSON.stringify(citations),
        "X-Source-Count": citations.length.toString(),
        "X-RAG-Enabled": useRAG.toString(),
        "X-Live-Sources-Enabled": useLiveSources.toString(),
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

function formatRAGResults(results: any[]): string {
  if (!results || results.length === 0) return ""

  return results
    .slice(0, 6)
    .map((result, index) => {
      const title = result.title || "Legal Document"
      const source = result.source || "Legal Database"
      const content = result.content || result.excerpt || ""

      return `[Source ${index + 1}] ${source} - ${title}
Content: ${content.substring(0, 400)}${content.length > 400 ? "..." : ""}
---`
    })
    .join("\n\n")
}

function formatLiveResults(results: any[]): string {
  if (!results || results.length === 0) return ""

  const startIndex = 7 // Start after RAG results
  return results
    .slice(0, 4)
    .map((result, index) => {
      const title = result.title || "Live Legal Source"
      const source = `${result.source || "External Source"} (Live)`
      const content = result.content || result.excerpt || ""

      return `[Source ${startIndex + index}] ${source} - ${title}
Content: ${content.substring(0, 300)}${content.length > 300 ? "..." : ""}
---`
    })
    .join("\n\n")
}
