import { streamText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(req: Request) {
  try {
    const { messages, useRAG = true, useLiveSources = true } = await req.json()

    if (!messages || messages.length === 0) {
      return new Response("Messages are required", { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    let enhancedContext = ""
    let allResults: any[] = []

    if ((useRAG || useLiveSources) && lastMessage.role === "user") {
      try {
        // Get the base URL from the request
        const url = new URL(req.url)
        const baseUrl = `${url.protocol}//${url.host}`

        // Use alternative RAG search that doesn't require vector extension
        const searchResponse = await fetch(`${baseUrl}/api/rag/alternative-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: lastMessage.content,
            limit: 10,
          }),
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          enhancedContext = formatSearchResults(searchData.results)
          allResults = searchData.results
        } else {
          console.warn("Alternative search failed, proceeding without context")
        }

        // If live sources are enabled, also search external sources
        if (useLiveSources) {
          try {
            const liveSearchResponse = await fetch(`${baseUrl}/api/legal-search/live`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: lastMessage.content,
                limit: 5,
              }),
            })

            if (liveSearchResponse.ok) {
              const liveSearchData = await liveSearchResponse.json()
              const liveContext = formatLiveSearchResults(liveSearchData.results)
              enhancedContext += "\n\n" + liveContext
              allResults = [...allResults, ...liveSearchData.results]
            }
          } catch (error) {
            console.error("Live search error:", error)
          }
        }
      } catch (error) {
        console.error("Enhanced search error:", error)
      }
    }

    // Create status message about sources
    const sourceStatus = []
    if (useRAG) sourceStatus.push("legal database")
    if (useLiveSources) sourceStatus.push("live legal sources")

    const statusMessage =
      sourceStatus.length > 0
        ? `\n\nSources searched: ${sourceStatus.join(" and ")}`
        : "\n\nNote: No legal sources were searched for this query."

    const systemPrompt = `You are a legal research assistant with access to comprehensive legal databases and live legal sources.

IMPORTANT INSTRUCTIONS:
1. Base your responses on the provided legal context below
2. Always cite your sources using the format [Source X] where X corresponds to the source number
3. Distinguish between database sources and live sources when citing
4. If the context doesn't contain relevant information, clearly state this limitation
5. Provide accurate legal information with proper citations
6. Be thorough but concise in your explanations
7. When citing cases, include the full citation if available

LEGAL CONTEXT FROM MULTIPLE SOURCES:
${enhancedContext}${statusMessage}

If no relevant context is provided above, inform the user that you need more specific legal information to provide accurate guidance.`

    const result = streamText({
      model: google("gemini-1.5-pro"),
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.1,
    })

    return result.toDataStreamResponse({
      headers: {
        "X-Citations": JSON.stringify(allResults.slice(0, 10)),
        "X-Source-Count": allResults.length.toString(),
        "X-RAG-Enabled": useRAG.toString(),
        "X-Live-Sources-Enabled": useLiveSources.toString(),
      },
    })
  } catch (error) {
    console.error("Enhanced RAG chat error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

function formatSearchResults(results: any[]): string {
  if (!results || results.length === 0) {
    return "No relevant legal sources found."
  }

  const contextSections = results.slice(0, 8).map((result, index) => {
    const metadata = result.metadata || {}
    const title = metadata.title || "Untitled Document"
    const source = metadata.source || "Legal Database"
    const citations = metadata.citations ? metadata.citations.join(", ") : ""

    return `[Source ${index + 1}] ${source} - ${title}
Content: ${result.content.substring(0, 500)}${result.content.length > 500 ? "..." : ""}
${citations ? `Citations: ${citations}` : ""}
---`
  })

  return contextSections.join("\n\n")
}

function formatLiveSearchResults(results: any[]): string {
  if (!results || results.length === 0) {
    return "No relevant live legal sources found."
  }

  const startIndex = 9 // Start numbering after the database sources
  const contextSections = results.slice(0, 5).map((result, index) => {
    const sourceInfo = `${result.source} (Live)`
    const citation = result.citation ? ` - ${result.citation}` : ""
    const court = result.court ? ` - ${result.court}` : ""

    return `[Source ${startIndex + index}] ${sourceInfo}${citation}${court}
Title: ${result.title}
Content: ${result.content.substring(0, 500)}${result.content.length > 500 ? "..." : ""}
---`
  })

  return contextSections.join("\n\n")
}
