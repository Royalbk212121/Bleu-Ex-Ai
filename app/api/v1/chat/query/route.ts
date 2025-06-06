import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { vectorSearch, logResearchQuery } from "@/lib/database"
import { generateEmbedding } from "@/lib/embeddings"
import type { NextRequest } from "next/server"

interface ChatQueryRequest {
  queryText: string
  sessionId: string
  fileContextId?: string
}

interface LegalSource {
  id: number
  caseName: string
  court: string
  date: string
  url: string
  jurisdiction: string
  documentType: string
  relevanceScore: number
  excerpt: string
}

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now()
    const { queryText, sessionId, fileContextId }: ChatQueryRequest = await req.json()

    if (!queryText || !sessionId) {
      return new Response("Missing required fields: queryText and sessionId", { status: 400 })
    }

    // Step 1: Generate vector embedding for the query
    const queryEmbedding = await generateEmbedding(queryText)

    // Step 2: Perform vector search to find top 5 most relevant legal chunks
    const relevantChunks = await vectorSearch(queryEmbedding, 5)

    // Step 3: Structure the sources for citation
    const sources: LegalSource[] = relevantChunks.map((chunk, index) => ({
      id: index + 1,
      caseName: chunk.document_title || "Legal Document",
      court: chunk.metadata?.court || "Unknown Court",
      date: chunk.metadata?.date || "Unknown Date",
      url: chunk.source_url || "#",
      jurisdiction: chunk.metadata?.jurisdiction || "Unknown",
      documentType: chunk.metadata?.document_type || "Legal Document",
      relevanceScore: 1 - (chunk.distance || 0),
      excerpt: chunk.chunk_text.substring(0, 200) + "...",
    }))

    // Step 4: Build context from relevant chunks
    const contextChunks = relevantChunks
      .map((chunk, index) => {
        return `[Source ${index + 1}]: ${chunk.chunk_text}\n[Citation: ${sources[index].caseName}, ${sources[index].court}, ${sources[index].date}]\n`
      })
      .join("\n---\n")

    // Step 5: Create enhanced prompt with RAG context
    const enhancedPrompt = `You are a legal research assistant. Use the provided legal context to answer the user's question accurately and comprehensively.

LEGAL CONTEXT:
${contextChunks}

CITATION INSTRUCTIONS:
- When referencing information from the provided sources, use the format [citation:N] where N corresponds to the source number
- Each [citation:N] must link to one of the provided sources above
- Always cite your sources when making legal statements
- If information is not available in the provided context, clearly state this limitation

USER QUESTION: ${queryText}

Provide a comprehensive answer using the legal context above. Format your response with proper markdown and include relevant citations.`

    // Step 6: Stream response from LLM
    const result = streamText({
      model: google("gemini-1.5-pro"),
      prompt: enhancedPrompt,
      system: `You are an expert legal research assistant. Provide accurate, well-researched legal information with proper citations.

RESPONSE FORMAT REQUIREMENTS:
- Use clear, professional language suitable for legal education
- Structure your response with headings and bullet points where appropriate
- Always include [citation:N] references when using information from provided sources
- Be thorough but concise in explanations
- Include relevant legal principles and precedents
- Format legal citations properly

CITATION FORMAT:
- Use [citation:1], [citation:2], etc. to reference the numbered sources provided
- Each citation number must correspond to a source in the context
- Multiple citations can be used: [citation:1][citation:2]

Remember: You are helping users understand legal concepts for educational purposes.`,
    })

    // Step 7: Create streaming response with sources metadata
    const response = result.toDataStreamResponse({
      headers: {
        "X-Session-Id": sessionId,
        "X-Sources": JSON.stringify(sources),
        "X-Query-Id": crypto.randomUUID(),
      },
    })

    // Step 8: Log the research query
    const executionTime = Date.now() - startTime
    await logResearchQuery({
      queryText,
      queryType: "chat_rag",
      resultsCount: sources.length,
      executionTimeMs: executionTime,
    })

    return response
  } catch (error) {
    console.error("Chat query API error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to process chat query",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
