/**
 * Legal Data Ingestion Pipeline
 * Handles the ingestion, processing, and storage of legal data
 */
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { v4 as uuidv4 } from "uuid"
import { postgresClient } from "@/lib/database/postgres-client"
import { mongoDBClient } from "@/lib/database/mongodb-client"
import { vectorClient } from "@/lib/database/vector-client"
import { chunkText } from "@/lib/embeddings"
import * as pdfParse from "pdf-parse"

// S3 client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

interface LegalDocument {
  title: string
  content: string
  documentType: string
  jurisdiction?: string
  practiceArea?: string
  source: string
  sourceUrl?: string
  publicationDate?: string
  metadata?: Record<string, any>
}

interface ProcessedChunk {
  id: string
  text: string
  metadata: {
    documentId: string
    source: string
    sourceUrl?: string
    jurisdiction?: string
    practiceArea?: string
    documentType: string
    date?: string
    section?: string
    pageNumber?: number
    [key: string]: any
  }
}

/**
 * Legal data ingestion service
 */
export class LegalDataIngestionService {
  /**
   * Process document from S3
   */
  async processS3Document(bucket: string, key: string): Promise<string> {
    try {
      console.log(`Processing document from S3: ${bucket}/${key}`)

      // Get file from S3
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })

      const response = await s3Client.send(command)
      const contentType = response.ContentType || ""

      // Read file content
      const chunks: Uint8Array[] = []
      for await (const chunk of response.Body as any) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)

      // Extract text based on file type
      let text = ""
      if (contentType.includes("pdf")) {
        const pdfData = await pdfParse(buffer)
        text = pdfData.text
      } else if (contentType.includes("text")) {
        text = buffer.toString("utf-8")
      } else {
        throw new Error(`Unsupported content type: ${contentType}`)
      }

      // Extract metadata from filename and path
      const metadata = this.extractMetadataFromKey(key)

      // Create document
      const document: LegalDocument = {
        title: metadata.title || key.split("/").pop() || "Untitled Document",
        content: text,
        documentType: metadata.documentType || "CASE",
        jurisdiction: metadata.jurisdiction,
        practiceArea: metadata.practiceArea,
        source: "S3",
        sourceUrl: `s3://${bucket}/${key}`,
        publicationDate: metadata.date,
        metadata: {
          s3Bucket: bucket,
          s3Key: key,
          contentType,
          processingDate: new Date().toISOString(),
          ...metadata,
        },
      }

      // Process and store document
      return await this.processAndStoreDocument(document)
    } catch (error) {
      console.error("Error processing S3 document:", error)
      throw error
    }
  }

  /**
   * Process document from URL
   */
  async processUrlDocument(url: string, metadata: Record<string, any> = {}): Promise<string> {
    try {
      console.log(`Processing document from URL: ${url}`)

      // Fetch document
      const response = await fetch(url)
      const contentType = response.headers.get("content-type") || ""
      const buffer = await response.arrayBuffer()

      // Extract text based on file type
      let text = ""
      if (contentType.includes("pdf")) {
        const pdfData = await pdfParse(Buffer.from(buffer))
        text = pdfData.text
      } else if (contentType.includes("text") || contentType.includes("html")) {
        text = new TextDecoder().decode(buffer)
      } else {
        throw new Error(`Unsupported content type: ${contentType}`)
      }

      // Create document
      const document: LegalDocument = {
        title: metadata.title || url.split("/").pop() || "Untitled Document",
        content: text,
        documentType: metadata.documentType || "CASE",
        jurisdiction: metadata.jurisdiction,
        practiceArea: metadata.practiceArea,
        source: "URL",
        sourceUrl: url,
        publicationDate: metadata.date,
        metadata: {
          url,
          contentType,
          processingDate: new Date().toISOString(),
          ...metadata,
        },
      }

      // Process and store document
      return await this.processAndStoreDocument(document)
    } catch (error) {
      console.error("Error processing URL document:", error)
      throw error
    }
  }

  /**
   * Process and store document
   */
  async processAndStoreDocument(document: LegalDocument): Promise<string> {
    try {
      // Generate document ID
      const documentId = uuidv4()

      // Store document metadata in PostgreSQL
      await this.storeDocumentMetadata(documentId, document)

      // Store document content in MongoDB
      await this.storeDocumentContent(documentId, document)

      // Process document for vector database
      await this.processForVectorDB(documentId, document)

      return documentId
    } catch (error) {
      console.error("Error processing and storing document:", error)
      throw error
    }
  }

  /**
   * Store document metadata in PostgreSQL
   */
  private async storeDocumentMetadata(documentId: string, document: LegalDocument): Promise<void> {
    try {
      // Get document type ID
      const documentTypes = await postgresClient.query("SELECT id FROM document_types WHERE code = $1", [
        document.documentType,
      ])
      const documentTypeId = documentTypes.length > 0 ? documentTypes[0].id : null

      // Get jurisdiction ID if provided
      let jurisdictionId = null
      if (document.jurisdiction) {
        const jurisdictions = await postgresClient.query("SELECT id FROM jurisdictions WHERE code = $1", [
          document.jurisdiction,
        ])
        jurisdictionId = jurisdictions.length > 0 ? jurisdictions[0].id : null
      }

      // Get practice area ID if provided
      let practiceAreaId = null
      if (document.practiceArea) {
        const practiceAreas = await postgresClient.query("SELECT id FROM practice_areas WHERE code = $1", [
          document.practiceArea,
        ])
        practiceAreaId = practiceAreas.length > 0 ? practiceAreas[0].id : null
      }

      // Create document metadata
      await postgresClient.createDocumentMetadata({
        id: documentId,
        title: document.title,
        user_id: null, // System document
        document_type_id: documentTypeId,
        jurisdiction_id: jurisdictionId,
        practice_area_id: practiceAreaId,
        source: document.source,
        source_url: document.sourceUrl,
        publication_date: document.publicationDate,
        status: "active",
        metadata: document.metadata,
      })
    } catch (error) {
      console.error("Error storing document metadata:", error)
      throw error
    }
  }

  /**
   * Store document content in MongoDB
   */
  private async storeDocumentContent(documentId: string, document: LegalDocument): Promise<void> {
    try {
      await mongoDBClient.saveDocumentContent(documentId, document.content, null, 1, "system")
    } catch (error) {
      console.error("Error storing document content:", error)
      throw error
    }
  }

  /**
   * Process document for vector database
   */
  private async processForVectorDB(documentId: string, document: LegalDocument): Promise<void> {
    try {
      // Chunk document text
      const textChunks = chunkText(document.content, 1000, 100)

      // Process chunks
      const processedChunks: ProcessedChunk[] = textChunks.map((chunk, index) => {
        // Extract section title if possible
        const sectionMatch = chunk.match(/^(SECTION|Article|Chapter|Part)\s+([IVX\d]+)/i)
        const section = sectionMatch ? sectionMatch[0] : undefined

        return {
          id: `${documentId}-chunk-${index}`,
          text: chunk,
          metadata: {
            documentId,
            source: document.source,
            sourceUrl: document.sourceUrl,
            jurisdiction: document.jurisdiction,
            practiceArea: document.practiceArea,
            documentType: document.documentType,
            date: document.publicationDate,
            section,
            chunkIndex: index,
          },
        }
      })

      // Store chunks in vector database
      await vectorClient.storeTextChunks(processedChunks)
    } catch (error) {
      console.error("Error processing document for vector database:", error)
      throw error
    }
  }

  /**
   * Extract metadata from S3 key
   */
  private extractMetadataFromKey(key: string): Record<string, any> {
    const metadata: Record<string, any> = {}
    const parts = key.split("/")

    // Example key format: legal-data/us-fed/cases/2023/smith-v-jones.pdf
    if (parts.length >= 2) {
      // Try to extract jurisdiction
      const jurisdictionMap: Record<string, string> = {
        "us-fed": "US-FED",
        "us-ca": "US-CA",
        "us-ny": "US-NY",
      }
      metadata.jurisdiction = jurisdictionMap[parts[1]] || parts[1]
    }

    if (parts.length >= 3) {
      // Try to extract document type
      const typeMap: Record<string, string> = {
        cases: "CASE",
        statutes: "STATUTE",
        regulations: "REGULATION",
        guides: "GUIDE",
      }
      metadata.documentType = typeMap[parts[2]] || parts[2].toUpperCase()
    }

    if (parts.length >= 4) {
      // Try to extract date
      const yearMatch = parts[3].match(/^\d{4}$/)
      if (yearMatch) {
        metadata.date = `${yearMatch[0]}-01-01`
      }
    }

    // Extract title from filename
    const filename = parts[parts.length - 1]
    const titleMatch = filename.match(/^(.+)\.[^.]+$/)
    if (titleMatch) {
      metadata.title = titleMatch[1].replace(/-/g, " ")
    }

    return metadata
  }
}

export const legalDataIngestionService = new LegalDataIngestionService()
