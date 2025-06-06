/**
 * Document Service
 * Handles CRUD operations for documents, parsing, and versioning
 */

import { createClient } from "@supabase/supabase-js"
import { put, del } from "@vercel/blob"
import mammoth from "mammoth"
import * as pdfParse from "pdf-parse"

interface Document {
  id: string
  userId: string
  title: string
  content: string
  type: string
  size: number
  url: string
  version: number
  status: string
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface DocumentVersion {
  id: string
  documentId: string
  version: number
  content: string
  changes: string
  createdBy: string
  createdAt: string
}

export class DocumentService {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  /**
   * Upload and process document
   */
  async uploadDocument(userId: string, file: File, metadata: Record<string, any> = {}): Promise<Document> {
    try {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
      ]

      if (!allowedTypes.includes(file.type)) {
        throw new Error("Unsupported file type")
      }

      // Upload to Vercel Blob
      const blob = await put(file.name, file, {
        access: "public",
        addRandomSuffix: true,
      })

      // Extract text content
      const content = await this.extractTextContent(file)

      // Create document record
      const { data: document, error } = await this.supabase
        .from("legal_documents")
        .insert({
          user_id: userId,
          title: file.name,
          content: content,
          document_type: this.getDocumentType(file.type),
          size: file.size,
          source_url: blob.url,
          version: 1,
          status: "active",
          metadata: {
            ...metadata,
            originalName: file.name,
            mimeType: file.type,
            uploadedAt: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single()

      if (error) {
        throw new Error(`Document creation failed: ${error.message}`)
      }

      // Create initial version
      await this.createDocumentVersion(document.id, content, "Initial upload", userId)

      return this.formatDocument(document)
    } catch (error) {
      console.error("Upload document error:", error)
      throw error
    }
  }

  /**
   * Get user documents
   */
  async getUserDocuments(
    userId: string,
    options: {
      limit?: number
      offset?: number
      type?: string
      status?: string
    } = {},
  ): Promise<{ documents: Document[]; total: number }> {
    try {
      let query = this.supabase.from("legal_documents").select("*", { count: "exact" }).eq("user_id", userId)

      if (options.type) {
        query = query.eq("document_type", options.type)
      }

      if (options.status) {
        query = query.eq("status", options.status)
      }

      const {
        data: documents,
        error,
        count,
      } = await query
        .order("created_at", { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1)

      if (error) {
        throw new Error(`Failed to fetch documents: ${error.message}`)
      }

      return {
        documents: (documents || []).map(this.formatDocument),
        total: count || 0,
      }
    } catch (error) {
      console.error("Get user documents error:", error)
      throw error
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string, userId: string): Promise<Document> {
    try {
      const { data: document, error } = await this.supabase
        .from("legal_documents")
        .select("*")
        .eq("id", documentId)
        .eq("user_id", userId)
        .single()

      if (error || !document) {
        throw new Error("Document not found")
      }

      return this.formatDocument(document)
    } catch (error) {
      console.error("Get document error:", error)
      throw error
    }
  }

  /**
   * Update document content
   */
  async updateDocument(
    documentId: string,
    userId: string,
    updates: {
      title?: string
      content?: string
      metadata?: Record<string, any>
    },
  ): Promise<Document> {
    try {
      // Get current document
      const currentDoc = await this.getDocument(documentId, userId)

      // Prepare updates
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (updates.title) {
        updateData.title = updates.title
      }

      if (updates.content) {
        updateData.content = updates.content
        updateData.version = currentDoc.version + 1
      }

      if (updates.metadata) {
        updateData.metadata = {
          ...currentDoc.metadata,
          ...updates.metadata,
        }
      }

      // Update document
      const { data: document, error } = await this.supabase
        .from("legal_documents")
        .update(updateData)
        .eq("id", documentId)
        .eq("user_id", userId)
        .select("*")
        .single()

      if (error) {
        throw new Error(`Document update failed: ${error.message}`)
      }

      // Create version if content changed
      if (updates.content) {
        await this.createDocumentVersion(documentId, updates.content, "Content updated", userId)
      }

      return this.formatDocument(document)
    } catch (error) {
      console.error("Update document error:", error)
      throw error
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    try {
      // Get document to get blob URL
      const document = await this.getDocument(documentId, userId)

      // Delete from blob storage
      if (document.url) {
        try {
          await del(document.url)
        } catch (blobError) {
          console.warn("Failed to delete blob:", blobError)
        }
      }

      // Delete document versions
      await this.supabase.from("document_versions").delete().eq("document_id", documentId)

      // Delete document
      const { error } = await this.supabase.from("legal_documents").delete().eq("id", documentId).eq("user_id", userId)

      if (error) {
        throw new Error(`Document deletion failed: ${error.message}`)
      }
    } catch (error) {
      console.error("Delete document error:", error)
      throw error
    }
  }

  /**
   * Get document versions
   */
  async getDocumentVersions(documentId: string, userId: string): Promise<DocumentVersion[]> {
    try {
      // Verify user owns document
      await this.getDocument(documentId, userId)

      const { data: versions, error } = await this.supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", documentId)
        .order("version", { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch versions: ${error.message}`)
      }

      return versions || []
    } catch (error) {
      console.error("Get document versions error:", error)
      throw error
    }
  }

  /**
   * Restore document version
   */
  async restoreDocumentVersion(documentId: string, version: number, userId: string): Promise<Document> {
    try {
      // Get the version to restore
      const { data: versionData, error: versionError } = await this.supabase
        .from("document_versions")
        .select("content")
        .eq("document_id", documentId)
        .eq("version", version)
        .single()

      if (versionError || !versionData) {
        throw new Error("Version not found")
      }

      // Update document with version content
      return await this.updateDocument(documentId, userId, {
        content: versionData.content,
      })
    } catch (error) {
      console.error("Restore document version error:", error)
      throw error
    }
  }

  /**
   * Extract text content from file
   */
  private async extractTextContent(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer()

      switch (file.type) {
        case "application/pdf":
          const pdfData = await pdfParse(Buffer.from(buffer))
          return pdfData.text

        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          const docxResult = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
          return docxResult.value

        case "text/plain":
          return new TextDecoder().decode(buffer)

        default:
          return "Content extraction not supported for this file type"
      }
    } catch (error) {
      console.error("Text extraction error:", error)
      return "Failed to extract text content"
    }
  }

  /**
   * Create document version
   */
  private async createDocumentVersion(
    documentId: string,
    content: string,
    changes: string,
    userId: string,
  ): Promise<void> {
    try {
      // Get current version number
      const { data: latestVersion } = await this.supabase
        .from("document_versions")
        .select("version")
        .eq("document_id", documentId)
        .order("version", { ascending: false })
        .limit(1)
        .single()

      const newVersion = (latestVersion?.version || 0) + 1

      await this.supabase.from("document_versions").insert({
        document_id: documentId,
        version: newVersion,
        content: content,
        changes: changes,
        created_by: userId,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Create document version error:", error)
    }
  }

  /**
   * Get document type from MIME type
   */
  private getDocumentType(mimeType: string): string {
    const typeMap: Record<string, string> = {
      "application/pdf": "pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "application/msword": "doc",
      "text/plain": "txt",
    }

    return typeMap[mimeType] || "unknown"
  }

  /**
   * Format document for API response
   */
  private formatDocument(doc: any): Document {
    return {
      id: doc.id,
      userId: doc.user_id,
      title: doc.title,
      content: doc.content,
      type: doc.document_type,
      size: doc.size,
      url: doc.source_url,
      version: doc.version,
      status: doc.status,
      metadata: doc.metadata || {},
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    }
  }
}

export const documentService = new DocumentService()
