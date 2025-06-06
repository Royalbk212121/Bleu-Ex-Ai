/**
 * LexiconOmni™: The Living Legal Data & Knowledge Graph
 *
 * Core functionality for managing the exabyte-scale, multi-modal legal knowledge repository
 */

import { createClient } from "@supabase/supabase-js"
import { embed } from "ai"
import { google } from "@ai-sdk/google"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface LegalDocument {
  id?: string
  title: string
  content: string
  documentType: string
  jurisdiction?: string
  practiceArea?: string
  source: string
  sourceUrl?: string
  metadata?: Record<string, any>
}

export interface LegalEntity {
  id?: string
  entityType: "person" | "organization" | "court" | "government_body" | "company" | "law_firm"
  name: string
  canonicalId?: string
  aliases?: string[]
  description?: string
  metadata?: Record<string, any>
  externalIds?: Record<string, any>
}

export interface LegalConcept {
  id?: string
  conceptName: string
  conceptType: "doctrine" | "principle" | "rule" | "standard" | "test" | "theory" | "element"
  definition: string
  parentConceptId?: string
  relatedConcepts?: string[]
  jurisdictions?: string[]
  practiceAreas?: string[]
}

export interface LegalRelationship {
  sourceType: string
  sourceId: string
  relationshipType: string
  targetType: string
  targetId: string
  confidenceScore?: number
  metadata?: Record<string, any>
}

/**
 * Ingest a legal document into the knowledge graph
 */
export async function ingestLegalDocument(document: LegalDocument): Promise<string | null> {
  try {
    // Insert the document into the database
    const { data: docData, error: docError } = await supabase
      .from("legal_documents")
      .insert({
        title: document.title,
        content: document.content,
        document_type: document.documentType,
        jurisdiction: document.jurisdiction,
        practice_area: document.practiceArea,
        source: document.source,
        source_url: document.sourceUrl,
        metadata: document.metadata || {},
      })
      .select("id")
      .single()

    if (docError) {
      console.error("Error inserting document:", docError)
      return null
    }

    const documentId = docData.id

    // Extract entities from the document
    const entities = await extractEntities(document.content)
    for (const entity of entities) {
      await createOrUpdateEntity(entity)

      // Create relationship between document and entity
      await createRelationship({
        sourceType: "document",
        sourceId: documentId,
        relationshipType: "mentions",
        targetType: "entity",
        targetId: entity.id!,
        confidenceScore: 0.9,
      })
    }

    // Extract legal concepts from the document
    const concepts = await extractLegalConcepts(document.content)
    for (const concept of concepts) {
      await createOrUpdateConcept(concept)

      // Create relationship between document and concept
      await createRelationship({
        sourceType: "document",
        sourceId: documentId,
        relationshipType: "discusses",
        targetType: "concept",
        targetId: concept.id!,
        confidenceScore: 0.85,
      })
    }

    // Extract citations from the document
    const citations = extractCitations(document.content)
    for (const citation of citations) {
      // Store citation and create relationships
      await storeCitation(documentId, citation)
    }

    // Generate embeddings for the document
    await generateDocumentEmbeddings(documentId, document.content)

    return documentId
  } catch (error) {
    console.error("Error in document ingestion:", error)
    return null
  }
}

/**
 * Extract entities from text using AI
 */
async function extractEntities(text: string): Promise<LegalEntity[]> {
  try {
    // In a production system, this would use a specialized NER model
    // For now, we'll simulate with a simple extraction
    const entities: LegalEntity[] = []

    // Extract people (very simplified)
    const peopleRegex = /([A-Z][a-z]+ [A-Z][a-z]+)(?:\s+(?:v\.|vs\.|versus))/g
    let match
    while ((match = peopleRegex.exec(text)) !== null) {
      entities.push({
        entityType: "person",
        name: match[1],
      })
    }

    // Extract courts (very simplified)
    const courtRegex = /(Supreme Court|District Court|Circuit Court|Court of Appeals)/g
    while ((match = courtRegex.exec(text)) !== null) {
      entities.push({
        entityType: "court",
        name: match[1],
      })
    }

    // Generate unique IDs for entities
    return entities.map((entity) => ({
      ...entity,
      id: crypto.randomUUID(),
    }))
  } catch (error) {
    console.error("Error extracting entities:", error)
    return []
  }
}

/**
 * Extract legal concepts from text using AI
 */
async function extractLegalConcepts(text: string): Promise<LegalConcept[]> {
  try {
    // In a production system, this would use a specialized legal concept extraction model
    // For now, we'll simulate with a simple extraction
    const concepts: LegalConcept[] = []

    // Extract some common legal concepts (very simplified)
    const conceptRegex =
      /(due process|equal protection|reasonable doubt|negligence|strict liability|mens rea|actus reus)/gi
    let match
    while ((match = conceptRegex.exec(text)) !== null) {
      const conceptName = match[1].toLowerCase()

      // Determine concept type based on the concept name
      let conceptType: LegalConcept["conceptType"] = "principle"
      if (conceptName.includes("test") || conceptName.includes("standard")) {
        conceptType = "test"
      } else if (conceptName.includes("doctrine")) {
        conceptType = "doctrine"
      } else if (conceptName.includes("rule")) {
        conceptType = "rule"
      }

      concepts.push({
        conceptName: conceptName,
        conceptType: conceptType,
        definition: `Legal concept of ${conceptName}`, // In production, this would be a real definition
        id: crypto.randomUUID(),
      })
    }

    return concepts
  } catch (error) {
    console.error("Error extracting legal concepts:", error)
    return []
  }
}

/**
 * Extract citations from text
 */
function extractCitations(text: string): string[] {
  const citations: string[] = []

  // U.S. Supreme Court citations
  const scotusRegex = /\d+\s+U\.S\.\s+\d+/g
  let match
  while ((match = scotusRegex.exec(text)) !== null) {
    citations.push(match[0])
  }

  // Federal Reporter citations
  const fedRegex = /\d+\s+F\.\d+d?\s+\d+/g
  while ((match = fedRegex.exec(text)) !== null) {
    citations.push(match[0])
  }

  // Case names
  const caseRegex = /([A-Z][a-z]+ v\. [A-Z][a-z]+)/g
  while ((match = caseRegex.exec(text)) !== null) {
    citations.push(match[0])
  }

  return citations
}

/**
 * Store a citation and create relationships
 */
async function storeCitation(documentId: string, citationText: string): Promise<void> {
  try {
    // Insert citation
    const { data: citationData, error: citationError } = await supabase
      .from("legal_citations")
      .insert({
        citing_document_id: documentId,
        citation_text: citationText,
        citation_type: determineCitationType(citationText),
      })
      .select("id")
      .single()

    if (citationError) {
      console.error("Error storing citation:", citationError)
      return
    }

    // In a production system, we would resolve the citation to an actual document or case
    // and create the appropriate relationships
  } catch (error) {
    console.error("Error storing citation:", error)
  }
}

/**
 * Determine the type of citation
 */
function determineCitationType(citation: string): "case" | "statute" | "regulation" | "secondary" {
  if (citation.includes("U.S.") || citation.includes("F.") || citation.includes(" v. ")) {
    return "case"
  } else if (citation.includes("U.S.C.") || citation.includes("Code")) {
    return "statute"
  } else if (citation.includes("C.F.R.") || citation.includes("Fed. Reg.")) {
    return "regulation"
  } else {
    return "secondary"
  }
}

/**
 * Create or update a legal entity
 */
async function createOrUpdateEntity(entity: LegalEntity): Promise<string | null> {
  try {
    // Check if entity already exists
    const { data: existingEntities, error: queryError } = await supabase
      .from("legal_entities")
      .select("id")
      .eq("name", entity.name)
      .eq("entity_type", entity.entityType)

    if (queryError) {
      console.error("Error querying entity:", queryError)
      return null
    }

    if (existingEntities && existingEntities.length > 0) {
      // Entity exists, return its ID
      entity.id = existingEntities[0].id
      return entity.id
    }

    // Entity doesn't exist, create it
    const { data: newEntity, error: insertError } = await supabase
      .from("legal_entities")
      .insert({
        entity_type: entity.entityType,
        name: entity.name,
        canonical_id: entity.canonicalId,
        aliases: entity.aliases,
        description: entity.description,
        metadata: entity.metadata || {},
        external_ids: entity.externalIds || {},
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("Error inserting entity:", insertError)
      return null
    }

    entity.id = newEntity.id
    return entity.id
  } catch (error) {
    console.error("Error creating/updating entity:", error)
    return null
  }
}

/**
 * Create or update a legal concept
 */
async function createOrUpdateConcept(concept: LegalConcept): Promise<string | null> {
  try {
    // Check if concept already exists
    const { data: existingConcepts, error: queryError } = await supabase
      .from("legal_concepts")
      .select("id")
      .eq("concept_name", concept.conceptName)
      .eq("concept_type", concept.conceptType)

    if (queryError) {
      console.error("Error querying concept:", queryError)
      return null
    }

    if (existingConcepts && existingConcepts.length > 0) {
      // Concept exists, return its ID
      concept.id = existingConcepts[0].id
      return concept.id
    }

    // Generate embedding for the concept
    const embedding = await generateEmbedding(`${concept.conceptName}: ${concept.definition}`)

    // Concept doesn't exist, create it
    const { data: newConcept, error: insertError } = await supabase
      .from("legal_concepts")
      .insert({
        concept_name: concept.conceptName,
        concept_type: concept.conceptType,
        definition: concept.definition,
        parent_concept_id: concept.parentConceptId,
        related_concepts: concept.relatedConcepts,
        jurisdictions: concept.jurisdictions,
        practice_areas: concept.practiceAreas,
        embedding: embedding,
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("Error inserting concept:", insertError)
      return null
    }

    concept.id = newConcept.id
    return concept.id
  } catch (error) {
    console.error("Error creating/updating concept:", error)
    return null
  }
}

/**
 * Create a relationship between entities in the knowledge graph
 */
async function createRelationship(relationship: LegalRelationship): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("legal_relationships")
      .insert({
        source_type: relationship.sourceType,
        source_id: relationship.sourceId,
        relationship_type: relationship.relationshipType,
        target_type: relationship.targetType,
        target_id: relationship.targetId,
        confidence_score: relationship.confidenceScore,
        metadata: relationship.metadata || {},
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating relationship:", error)
      return null
    }

    return data.id
  } catch (error) {
    console.error("Error creating relationship:", error)
    return null
  }
}

/**
 * Generate embeddings for a document and store them
 */
async function generateDocumentEmbeddings(documentId: string, content: string): Promise<void> {
  try {
    // Split content into chunks
    const chunks = splitIntoChunks(content)

    // Generate embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = await generateEmbedding(chunk)

      // Store embedding
      await supabase.from("document_embeddings").insert({
        document_id: documentId,
        chunk_index: i,
        chunk_text: chunk,
        embedding: embedding,
      })
    }
  } catch (error) {
    console.error("Error generating document embeddings:", error)
  }
}

/**
 * Split text into chunks for embedding
 */
function splitIntoChunks(text: string, maxChunkSize = 1000): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n\s*\n/)

  let currentChunk = ""
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk)
      currentChunk = paragraph
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
}

/**
 * Generate embedding for text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: google.embedding("text-embedding-004"),
      value: text,
    })

    return embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    // Return a dummy embedding for development
    return Array(1536)
      .fill(0)
      .map(() => Math.random() * 2 - 1)
  }
}

/**
 * Search the knowledge graph using natural language
 */
export async function searchKnowledgeGraph(
  query: string,
  options: {
    limit?: number
    filters?: Record<string, any>
  } = {},
): Promise<any[]> {
  try {
    const embedding = await generateEmbedding(query)
    const limit = options.limit || 10

    // Search document embeddings
    const { data: documents, error: docError } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
    })

    if (docError) {
      console.error("Error searching documents:", docError)
      return []
    }

    // Search legal concepts
    const { data: concepts, error: conceptError } = await supabase.rpc("match_concepts", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
    })

    if (conceptError) {
      console.error("Error searching concepts:", conceptError)
      return []
    }

    // Combine and rank results
    const results = [
      ...(documents || []).map((doc: any) => ({
        ...doc,
        result_type: "document",
        score: doc.similarity,
      })),
      ...(concepts || []).map((concept: any) => ({
        ...concept,
        result_type: "concept",
        score: concept.similarity,
      })),
    ]

    // Sort by score
    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  } catch (error) {
    console.error("Error searching knowledge graph:", error)
    return []
  }
}

/**
 * Get related entities for a given entity
 */
export async function getRelatedEntities(entityId: string, relationshipType?: string): Promise<any[]> {
  try {
    let query = supabase
      .from("legal_relationships")
      .select(`
        id,
        relationship_type,
        target_type,
        target_id,
        confidence_score,
        metadata,
        created_at
      `)
      .eq("source_id", entityId)

    if (relationshipType) {
      query = query.eq("relationship_type", relationshipType)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error getting related entities:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error getting related entities:", error)
    return []
  }
}

/**
 * Get the knowledge graph for visualization
 */
export async function getKnowledgeGraphVisualization(centerId: string, depth = 2): Promise<any> {
  try {
    const nodes: any[] = []
    const edges: any[] = []
    const processedIds = new Set<string>()

    await traverseGraph(centerId, depth, nodes, edges, processedIds)

    return { nodes, edges }
  } catch (error) {
    console.error("Error getting knowledge graph visualization:", error)
    return { nodes: [], edges: [] }
  }
}

/**
 * Recursively traverse the graph to build visualization data
 */
async function traverseGraph(
  entityId: string,
  depth: number,
  nodes: any[],
  edges: any[],
  processedIds: Set<string>,
  currentDepth = 0,
): Promise<void> {
  if (currentDepth > depth || processedIds.has(entityId)) {
    return
  }

  processedIds.add(entityId)

  // Get entity details
  const { data: entity, error: entityError } = await supabase
    .from("legal_entities")
    .select("*")
    .eq("id", entityId)
    .single()

  if (entityError) {
    console.error("Error getting entity:", entityError)
    return
  }

  // Add node
  nodes.push({
    id: entity.id,
    label: entity.name,
    type: entity.entity_type,
    metadata: entity.metadata,
  })

  // Get relationships
  const { data: relationships, error: relError } = await supabase
    .from("legal_relationships")
    .select("*")
    .or(`source_id.eq.${entityId},target_id.eq.${entityId}`)

  if (relError) {
    console.error("Error getting relationships:", relError)
    return
  }

  // Process relationships
  for (const rel of relationships) {
    // Add edge
    edges.push({
      id: rel.id,
      source: rel.source_id,
      target: rel.target_id,
      label: rel.relationship_type,
      weight: rel.confidence_score || 1,
    })

    // Recursively process connected entities
    const nextEntityId = rel.source_id === entityId ? rel.target_id : rel.source_id
    await traverseGraph(nextEntityId, depth, nodes, edges, processedIds, currentDepth + 1)
  }
}
