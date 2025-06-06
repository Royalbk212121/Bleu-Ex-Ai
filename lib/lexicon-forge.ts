/**
 * LexiconForge™: The Enrichment Engine
 *
 * Advanced AI pipeline for transforming raw legal data into actionable intelligence
 */

import { createClient } from "@supabase/supabase-js"
import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { generateEmbedding } from "./lexicon-embed"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface EnrichmentOptions {
  extractEntities?: boolean
  extractConcepts?: boolean
  extractEvents?: boolean
  extractCitations?: boolean
  generateSummary?: boolean
  identifyRisks?: boolean
  detectSentiment?: boolean
  mapPrecedents?: boolean
}

export interface EnrichmentResult {
  documentId: string
  entities: any[]
  concepts: any[]
  events: any[]
  citations: any[]
  summary?: string
  risks?: any[]
  sentiment?: {
    score: number
    label: "positive" | "negative" | "neutral"
  }
  precedentMap?: any[]
  processingTimeMs: number
}

/**
 * Enrich a legal document with advanced AI analysis
 */
export async function enrichDocument(documentId: string, options: EnrichmentOptions = {}): Promise<EnrichmentResult> {
  const startTime = Date.now()

  try {
    // Get the document
    const { data: document, error } = await supabase.from("legal_documents").select("*").eq("id", documentId).single()

    if (error) {
      throw new Error(`Document not found: ${error.message}`)
    }

    // Initialize result
    const result: EnrichmentResult = {
      documentId,
      entities: [],
      concepts: [],
      events: [],
      citations: [],
      processingTimeMs: 0,
    }

    // Run enrichment tasks in parallel
    const tasks: Promise<void>[] = []

    // Extract entities
    if (options.extractEntities !== false) {
      tasks.push(
        extractEntities(document.content).then((entities) => {
          result.entities = entities
          return storeEntities(documentId, entities)
        }),
      )
    }

    // Extract concepts
    if (options.extractConcepts !== false) {
      tasks.push(
        extractLegalConcepts(document.content).then((concepts) => {
          result.concepts = concepts
          return storeConcepts(documentId, concepts)
        }),
      )
    }

    // Extract events
    if (options.extractEvents !== false) {
      tasks.push(
        extractEvents(document.content).then((events) => {
          result.events = events
          return storeEvents(documentId, events)
        }),
      )
    }

    // Extract citations
    if (options.extractCitations !== false) {
      tasks.push(
        extractCitations(document.content).then((citations) => {
          result.citations = citations
          return storeCitations(documentId, citations)
        }),
      )
    }

    // Generate summary
    if (options.generateSummary) {
      tasks.push(
        generateLegalSummary(document.content).then((summary) => {
          result.summary = summary
          return updateDocumentSummary(documentId, summary)
        }),
      )
    }

    // Identify risks
    if (options.identifyRisks) {
      tasks.push(
        identifyLegalRisks(document.content, document.document_type).then((risks) => {
          result.risks = risks
          return storeRiskAnalysis(documentId, risks)
        }),
      )
    }

    // Detect sentiment
    if (options.detectSentiment) {
      tasks.push(
        detectLegalSentiment(document.content).then((sentiment) => {
          result.sentiment = sentiment
          return storeSentimentAnalysis(documentId, sentiment)
        }),
      )
    }

    // Map precedents
    if (options.mapPrecedents) {
      tasks.push(
        mapLegalPrecedents(document.content, document.document_type).then((precedentMap) => {
          result.precedentMap = precedentMap
          return storePrecedentMap(documentId, precedentMap)
        }),
      )
    }

    // Wait for all tasks to complete
    await Promise.all(tasks)

    // Calculate processing time
    result.processingTimeMs = Date.now() - startTime

    // Update document metadata with enrichment status
    await supabase
      .from("legal_documents")
      .update({
        metadata: {
          ...document.metadata,
          enriched: true,
          enrichment_time: new Date().toISOString(),
          enrichment_duration_ms: result.processingTimeMs,
        },
      })
      .eq("id", documentId)

    return result
  } catch (error) {
    console.error("Error enriching document:", error)
    throw error
  }
}

/**
 * Extract entities from text using AI
 */
async function extractEntities(text: string): Promise<any[]> {
  try {
    // In a production system, this would use a specialized NER model
    // For now, we'll use a simplified approach with Gemini

    const prompt = `
      Extract all named entities from the following legal text. 
      For each entity, identify:
      1. Entity name
      2. Entity type (person, organization, court, location, date, law, statute, regulation)
      3. Context (brief description of the entity's role in the text)
      
      Format the output as a JSON array of objects with properties: name, type, context
      
      Text:
      ${text.substring(0, 10000)} // Limit text length for API
    `

    const { text: response } = await streamText({
      model: google("gemini-1.5-pro"),
      prompt,
      temperature: 0.1,
    })

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return []
    }

    try {
      const entities = JSON.parse(jsonMatch[0])
      return entities.map((entity: any) => ({
        ...entity,
        id: crypto.randomUUID(),
      }))
    } catch (parseError) {
      console.error("Error parsing entities JSON:", parseError)
      return []
    }
  } catch (error) {
    console.error("Error extracting entities:", error)
    return []
  }
}

/**
 * Extract legal concepts from text using AI
 */
async function extractLegalConcepts(text: string): Promise<any[]> {
  try {
    const prompt = `
      Extract all legal concepts from the following legal text.
      For each concept, identify:
      1. Concept name
      2. Concept type (doctrine, principle, rule, standard, test, theory, element)
      3. Definition (brief explanation of the concept)
      4. Relevant jurisdiction (if mentioned)
      
      Format the output as a JSON array of objects with properties: name, type, definition, jurisdiction
      
      Text:
      ${text.substring(0, 10000)} // Limit text length for API
    `

    const { text: response } = await streamText({
      model: google("gemini-1.5-pro"),
      prompt,
      temperature: 0.1,
    })

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return []
    }

    try {
      const concepts = JSON.parse(jsonMatch[0])
      return concepts.map((concept: any) => ({
        ...concept,
        id: crypto.randomUUID(),
      }))
    } catch (parseError) {
      console.error("Error parsing concepts JSON:", parseError)
      return []
    }
  } catch (error) {
    console.error("Error extracting legal concepts:", error)
    return []
  }
}

/**
 * Extract events from text using AI
 */
async function extractEvents(text: string): Promise<any[]> {
  try {
    const prompt = `
      Extract all events and timeline information from the following legal text.
      For each event, identify:
      1. Event description
      2. Event date (as specific as possible)
      3. Event type (filing, hearing, decision, amendment, etc.)
      4. Entities involved
      
      Format the output as a JSON array of objects with properties: description, date, type, entities
      
      Text:
      ${text.substring(0, 10000)} // Limit text length for API
    `

    const { text: response } = await streamText({
      model: google("gemini-1.5-pro"),
      prompt,
      temperature: 0.1,
    })

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return []
    }

    try {
      const events = JSON.parse(jsonMatch[0])
      return events.map((event: any) => ({
        ...event,
        id: crypto.randomUUID(),
      }))
    } catch (parseError) {
      console.error("Error parsing events JSON:", parseError)
      return []
    }
  } catch (error) {
    console.error("Error extracting events:", error)
    return []
  }
}

/**
 * Extract citations from text using AI
 */
async function extractCitations(text: string): Promise<any[]> {
  try {
    // Extract citations using regex patterns
    const citations: any[] = []

    // U.S. Supreme Court citations
    const scotusRegex = /(\d+)\s+U\.S\.\s+(\d+)(?:\s+$$(\d{4})$$)?/g
    let match
    while ((match = scotusRegex.exec(text)) !== null) {
      citations.push({
        id: crypto.randomUUID(),
        text: match[0],
        type: "case",
        reporter: "U.S.",
        volume: match[1],
        page: match[2],
        year: match[3] || null,
      })
    }

    // Federal Reporter citations
    const fedRegex = /(\d+)\s+F\.(\d+)d?\s+(\d+)(?:\s+$$(\d+[a-zA-Z]+)(?:\s+Cir\.)?\s+(\d{4})$$)?/g
    while ((match = fedRegex.exec(text)) !== null) {
      citations.push({
        id: crypto.randomUUID(),
        text: match[0],
        type: "case",
        reporter: `F.${match[2]}d`,
        volume: match[1],
        page: match[3],
        court: match[4] || null,
        year: match[5] || null,
      })
    }

    // U.S. Code citations
    const uscRegex = /(\d+)\s+U\.S\.C\.(?:\s+§)?\s+(\d+[a-z]*)(?:$$([a-z0-9]+)$$)?/g
    while ((match = uscRegex.exec(text)) !== null) {
      citations.push({
        id: crypto.randomUUID(),
        text: match[0],
        type: "statute",
        title: match[1],
        section: match[2],
        subsection: match[3] || null,
      })
    }

    // Case names
    const caseRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+v\.\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
    while ((match = caseRegex.exec(text)) !== null) {
      citations.push({
        id: crypto.randomUUID(),
        text: match[0],
        type: "case",
        plaintiff: match[1],
        defendant: match[2],
      })
    }

    return citations
  } catch (error) {
    console.error("Error extracting citations:", error)
    return []
  }
}

/**
 * Generate a legal summary using AI
 */
async function generateLegalSummary(text: string): Promise<string> {
  try {
    const prompt = `
      Generate a comprehensive legal summary of the following text.
      The summary should:
      1. Identify the key legal issues and holdings
      2. Explain the reasoning and analysis
      3. Note any dissenting or concurring opinions
      4. Highlight the precedential value
      5. Be concise but thorough (300-500 words)
      
      Text:
      ${text.substring(0, 15000)} // Limit text length for API
    `

    const { text: summary } = await streamText({
      model: google("gemini-1.5-pro"),
      prompt,
      temperature: 0.2,
      maxTokens: 1000,
    })

    return summary
  } catch (error) {
    console.error("Error generating legal summary:", error)
    return "Error generating summary."
  }
}

/**
 * Identify legal risks in a document
 */
async function identifyLegalRisks(text: string, documentType: string): Promise<any[]> {
  try {
    const prompt = `
      Analyze the following ${documentType} for potential legal risks.
      For each risk, identify:
      1. Risk description
      2. Risk level (low, medium, high, critical)
      3. Relevant section or clause
      4. Potential impact
      5. Mitigation recommendation
      
      Format the output as a JSON array of objects with properties: description, level, section, impact, recommendation
      
      Text:
      ${text.substring(0, 10000)} // Limit text length for API
    `

    const { text: response } = await streamText({
      model: google("gemini-1.5-pro"),
      prompt,
      temperature: 0.1,
    })

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return []
    }

    try {
      const risks = JSON.parse(jsonMatch[0])
      return risks.map((risk: any) => ({
        ...risk,
        id: crypto.randomUUID(),
      }))
    } catch (parseError) {
      console.error("Error parsing risks JSON:", parseError)
      return []
    }
  } catch (error) {
    console.error("Error identifying legal risks:", error)
    return []
  }
}

/**
 * Detect sentiment in legal text
 */
async function detectLegalSentiment(text: string): Promise<{
  score: number
  label: "positive" | "negative" | "neutral"
}> {
  try {
    const prompt = `
      Analyze the sentiment of the following legal text.
      Consider factors like:
      - Favorable/unfavorable rulings
      - Supportive/critical language
      - Strength of arguments
      - Tone toward parties
      
      Return only a JSON object with:
      1. score: A number between -1 (very negative) and 1 (very positive)
      2. label: Either "positive", "negative", or "neutral"
      
      Text:
      ${text.substring(0, 5000)} // Limit text length for API
    `

    const { text: response } = await streamText({
      model: google("gemini-1.5-pro"),
      prompt,
      temperature: 0.1,
    })

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { score: 0, label: "neutral" }
    }

    try {
      const sentiment = JSON.parse(jsonMatch[0])
      return {
        score: sentiment.score,
        label: sentiment.label,
      }
    } catch (parseError) {
      console.error("Error parsing sentiment JSON:", parseError)
      return { score: 0, label: "neutral" }
    }
  } catch (error) {
    console.error("Error detecting sentiment:", error)
    return { score: 0, label: "neutral" }
  }
}

/**
 * Map legal precedents in a document
 */
async function mapLegalPrecedents(text: string, documentType: string): Promise<any[]> {
  try {
    const prompt = `
      Identify and analyze all legal precedents cited in the following ${documentType}.
      For each precedent, identify:
      1. Case name
      2. Citation
      3. How it's used (e.g., followed, distinguished, criticized)
      4. Importance to the current document (high, medium, low)
      5. Brief explanation of relevance
      
      Format the output as a JSON array of objects with properties: case, citation, usage, importance, relevance
      
      Text:
      ${text.substring(0, 10000)} // Limit text length for API
    `

    const { text: response } = await streamText({
      model: google("gemini-1.5-pro"),
      prompt,
      temperature: 0.1,
    })

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return []
    }

    try {
      const precedents = JSON.parse(jsonMatch[0])
      return precedents.map((precedent: any) => ({
        ...precedent,
        id: crypto.randomUUID(),
      }))
    } catch (parseError) {
      console.error("Error parsing precedents JSON:", parseError)
      return []
    }
  } catch (error) {
    console.error("Error mapping precedents:", error)
    return []
  }
}

/**
 * Store entities in the database
 */
async function storeEntities(documentId: string, entities: any[]): Promise<void> {
  try {
    for (const entity of entities) {
      // Check if entity exists
      const { data: existingEntities } = await supabase
        .from("legal_entities")
        .select("id")
        .eq("name", entity.name)
        .eq("entity_type", entity.type)
        .limit(1)

      let entityId: string

      if (existingEntities && existingEntities.length > 0) {
        // Entity exists
        entityId = existingEntities[0].id
      } else {
        // Create new entity
        const { data: newEntity, error } = await supabase
          .from("legal_entities")
          .insert({
            entity_type: entity.type,
            name: entity.name,
            description: entity.context,
          })
          .select("id")
          .single()

        if (error) {
          console.error("Error creating entity:", error)
          continue
        }

        entityId = newEntity.id
      }

      // Create relationship between document and entity
      await supabase.from("legal_relationships").insert({
        source_type: "document",
        source_id: documentId,
        relationship_type: "mentions",
        target_type: "entity",
        target_id: entityId,
        confidence_score: 0.9,
      })
    }
  } catch (error) {
    console.error("Error storing entities:", error)
  }
}

/**
 * Store concepts in the database
 */
async function storeConcepts(documentId: string, concepts: any[]): Promise<void> {
  try {
    for (const concept of concepts) {
      // Generate embedding for the concept
      const embedding = await generateEmbedding(`${concept.name}: ${concept.definition}`)

      // Check if concept exists
      const { data: existingConcepts } = await supabase
        .from("legal_concepts")
        .select("id")
        .eq("concept_name", concept.name)
        .limit(1)

      let conceptId: string

      if (existingConcepts && existingConcepts.length > 0) {
        // Concept exists
        conceptId = existingConcepts[0].id

        // Update concept
        await supabase
          .from("legal_concepts")
          .update({
            definition: concept.definition,
            embedding: embedding,
          })
          .eq("id", conceptId)
      } else {
        // Create new concept
        const { data: newConcept, error } = await supabase
          .from("legal_concepts")
          .insert({
            concept_name: concept.name,
            concept_type: concept.type,
            definition: concept.definition,
            jurisdictions: concept.jurisdiction ? [concept.jurisdiction] : [],
            embedding: embedding,
          })
          .select("id")
          .single()

        if (error) {
          console.error("Error creating concept:", error)
          continue
        }

        conceptId = newConcept.id
      }

      // Create relationship between document and concept
      await supabase.from("legal_relationships").insert({
        source_type: "document",
        source_id: documentId,
        relationship_type: "discusses",
        target_type: "concept",
        target_id: conceptId,
        confidence_score: 0.85,
      })

      // Create semantic tag
      const { data: tag, error: tagError } = await supabase
        .from("semantic_tags")
        .insert({
          tag_name: concept.name,
          tag_category: "legal_concept",
          description: concept.definition,
          embedding: embedding,
        })
        .select("id")
        .single()

      if (tagError) {
        console.error("Error creating semantic tag:", tagError)
        continue
      }

      // Link tag to document
      await supabase.from("document_semantic_tags").insert({
        document_id: documentId,
        tag_id: tag.id,
        confidence_score: 0.85,
      })
    }
  } catch (error) {
    console.error("Error storing concepts:", error)
  }
}

/**
 * Store events in the database
 */
async function storeEvents(documentId: string, events: any[]): Promise<void> {
  try {
    for (const event of events) {
      // Parse date
      let eventDate: Date | null = null
      try {
        if (event.date) {
          eventDate = new Date(event.date)
        }
      } catch (dateError) {
        console.error("Error parsing date:", dateError)
      }

      // Store event
      await supabase.from("legal_events").insert({
        event_type: event.type,
        event_date: eventDate?.toISOString() || null,
        description: event.description,
        documents: [documentId],
        metadata: {
          entities: event.entities,
          source_document: documentId,
        },
      })
    }
  } catch (error) {
    console.error("Error storing events:", error)
  }
}

/**
 * Store citations in the database
 */
async function storeCitations(documentId: string, citations: any[]): Promise<void> {
  try {
    for (const citation of citations) {
      await supabase.from("legal_citations").insert({
        citing_document_id: documentId,
        citation_text: citation.text,
        citation_type: citation.type,
      })
    }
  } catch (error) {
    console.error("Error storing citations:", error)
  }
}

/**
 * Update document summary
 */
async function updateDocumentSummary(documentId: string, summary: string): Promise<void> {
  try {
    await supabase.from("legal_documents").update({ summary }).eq("id", documentId)
  } catch (error) {
    console.error("Error updating document summary:", error)
  }
}

/**
 * Store risk analysis
 */
async function storeRiskAnalysis(documentId: string, risks: any[]): Promise<void> {
  try {
    // Count risks by level
    const riskCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    }

    for (const risk of risks) {
      if (risk.level in riskCounts) {
        riskCounts[risk.level as keyof typeof riskCounts]++
      }
    }

    // Determine overall risk level
    let overallRiskLevel = "low"
    if (riskCounts.critical > 0) {
      overallRiskLevel = "critical"
    } else if (riskCounts.high > 0) {
      overallRiskLevel = "high"
    } else if (riskCounts.medium > 0) {
      overallRiskLevel = "medium"
    }

    // Store analysis
    await supabase.from("document_analyses").insert({
      document_id: documentId,
      analysis_type: "risk_assessment",
      risk_level: overallRiskLevel,
      confidence_score: 0.85,
      issues_found: risks.length,
      key_findings: {
        risks: risks,
        risk_counts: riskCounts,
      },
      recommendations: {
        suggestions: risks.map((risk: any) => risk.recommendation),
      },
      ai_model: "gemini-1.5-pro",
    })
  } catch (error) {
    console.error("Error storing risk analysis:", error)
  }
}

/**
 * Store sentiment analysis
 */
async function storeSentimentAnalysis(documentId: string, sentiment: any): Promise<void> {
  try {
    // Update document metadata
    const { data: document } = await supabase.from("legal_documents").select("metadata").eq("id", documentId).single()

    await supabase
      .from("legal_documents")
      .update({
        metadata: {
          ...document.metadata,
          sentiment: sentiment,
        },
      })
      .eq("id", documentId)
  } catch (error) {
    console.error("Error storing sentiment analysis:", error)
  }
}

/**
 * Store precedent map
 */
async function storePrecedentMap(documentId: string, precedents: any[]): Promise<void> {
  try {
    for (const precedent of precedents) {
      // Store precedent influence
      await supabase.from("precedent_influence").insert({
        case_id: documentId,
        influenced_case_id: null, // We don't have the actual case ID
        influence_type: "direct_citation",
        influence_strength: precedent.importance === "high" ? 0.9 : precedent.importance === "medium" ? 0.6 : 0.3,
        influence_description: precedent.relevance,
        detected_by: "ai_analysis",
      })
    }
  } catch (error) {
    console.error("Error storing precedent map:", error)
  }
}
