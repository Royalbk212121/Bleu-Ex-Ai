import { z } from "zod"

// Document validation schemas
export const documentUploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  file: z.instanceof(File).refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB"),
  documentType: z.string().min(1, "Document type is required"),
  jurisdiction: z.string().optional(),
  practiceArea: z.string().optional(),
  description: z.string().max(1000, "Description too long").optional(),
})

export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(500, "Query too long"),
  jurisdiction: z.string().optional(),
  practiceArea: z.string().optional(),
  documentType: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  useRAG: z.boolean().default(true),
  useLiveSources: z.boolean().default(true),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
})

export const analysisSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
  analysisType: z.enum(["risk_assessment", "contract_review", "privilege_review", "compliance_check"]),
  options: z.record(z.any()).optional(),
})

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000, "Message too long"),
  conversationId: z.string().uuid().optional(),
  useRAG: z.boolean().default(true),
  useLiveSources: z.boolean().default(true),
})

export const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  role: z.enum(["user", "professional", "admin"]).default("user"),
  subscriptionTier: z.enum(["free", "professional", "enterprise"]).default("free"),
})

// API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

export const searchResponseSchema = z.object({
  query: z.string(),
  results: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      source: z.string(),
      sourceType: z.enum(["rag", "live"]),
      url: z.string().optional(),
      citation: z.string().optional(),
      court: z.string().optional(),
      date: z.string().optional(),
      jurisdiction: z.string().optional(),
      practiceArea: z.string().optional(),
      relevanceScore: z.number().optional(),
      similarity: z.number().optional(),
      citations: z.array(z.string()).optional(),
      metadata: z.record(z.any()).optional(),
    }),
  ),
  totalResults: z.number(),
  executionTimeMs: z.number(),
  sources: z.object({
    rag: z.boolean(),
    live: z.boolean(),
  }),
})

// Database validation
export const databaseStatusSchema = z.object({
  status: z.enum(["connected", "error", "initializing"]),
  tables: z.array(z.string()),
  counts: z.record(z.number()),
  timestamp: z.string(),
  error: z.string().optional(),
})

// Environment variables validation
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  SERP_API_KEY: z.string().optional(),
  COURT_LISTENER_API_KEY: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
})

// Utility functions for validation
export function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error("Environment validation failed:", error)
    throw new Error("Invalid environment configuration")
  }
}

export function validateApiResponse<T>(data: unknown, schema: z.ZodSchema<T>): T {
  try {
    return schema.parse(data)
  } catch (error) {
    console.error("API response validation failed:", error)
    throw new Error("Invalid API response format")
  }
}
