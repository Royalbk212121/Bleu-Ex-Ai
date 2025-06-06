// Legal platform type definitions

export interface LegalDocument {
  id: string
  title: string
  content: string
  summary?: string
  documentType: string
  jurisdiction?: string
  practiceArea?: string
  source: string
  sourceUrl?: string
  citations?: string[]
  keyTerms?: string[]
  publicationDate?: string
  effectiveDate?: string
  status: "active" | "archived" | "draft"
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface LegalCase {
  id: string
  caseName: string
  caseNumber?: string
  court: string
  jurisdiction: string
  decisionDate?: string
  filingDate?: string
  caseType?: string
  status?: string
  citation?: string
  docketNumber?: string
  judges?: string[]
  parties?: {
    plaintiff?: string[]
    defendant?: string[]
    [key: string]: string[] | undefined
  }
  summary?: string
  outcome?: string
  precedentialValue?: "binding" | "persuasive" | "non-precedential"
  createdAt: string
  updatedAt: string
}

export interface Jurisdiction {
  id: string
  name: string
  code: string
  country: string
  type: "federal" | "state" | "local" | "international"
  parentId?: string
  createdAt: string
}

export interface PracticeArea {
  id: string
  name: string
  code: string
  description?: string
  parentId?: string
  createdAt: string
}

export interface DocumentType {
  id: string
  name: string
  code: string
  description?: string
  category:
    | "case_law"
    | "statute"
    | "regulation"
    | "brief"
    | "contract"
    | "memo"
    | "pleading"
    | "discovery"
    | "settlement"
    | "opinion"
    | "filing"
  createdAt: string
}

export interface LegalCitation {
  id: string
  citingDocumentId: string
  citedDocumentId?: string
  citedCaseId?: string
  citationText: string
  citationType: "case" | "statute" | "regulation" | "secondary"
  context?: string
  pageNumber?: number
  treatment?: "followed" | "distinguished" | "overruled" | "criticized" | "cited"
  createdAt: string
}

export interface ResearchQuery {
  id: string
  userId?: string
  queryText: string
  queryType: "case_law" | "statute" | "general"
  jurisdictionFilter?: string
  practiceAreaFilter?: string
  dateRangeStart?: string
  dateRangeEnd?: string
  resultsCount: number
  executionTimeMs: number
  createdAt: string
}

export interface DocumentAnalysis {
  id: string
  documentId: string
  userId?: string
  analysisType: "risk_assessment" | "contract_review" | "privilege_review" | "compliance_check"
  riskLevel?: "low" | "medium" | "high" | "critical"
  confidenceScore?: number
  issuesFound: number
  keyFindings: Record<string, any>
  recommendations: Record<string, any>
  aiModel?: string
  processingTimeMs: number
  createdAt: string
}

export interface DocumentEmbedding {
  id: string
  documentId: string
  chunkIndex: number
  chunkText: string
  embedding: number[]
  sectionTitle?: string
  citations?: string[]
  metadata?: Record<string, any>
  createdAt: string
}

export interface LegalSource {
  id: string
  name: string
  code: string
  description?: string
  baseUrl?: string
  apiEndpoint?: string
  accessType: "free" | "subscription" | "api_key"
  rateLimit?: number
  supportedJurisdictions?: string[]
  supportedDocumentTypes?: string[]
  lastSync?: string
  isActive: boolean
  createdAt: string
}

export interface SearchResult {
  id: string
  title: string
  content: string
  source: string
  sourceType: "rag" | "live"
  url?: string
  citation?: string
  court?: string
  date?: string
  jurisdiction?: string
  practiceArea?: string
  relevanceScore?: number
  similarity?: number
  citations?: string[]
  metadata?: Record<string, any>
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  sources?: SearchResult[]
  citations?: string[]
  metadata?: Record<string, any>
}

export interface User {
  id: string
  email: string
  name: string
  role: "user" | "professional" | "admin"
  subscriptionTier: "free" | "professional" | "enterprise"
  createdAt: string
  updatedAt: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  totalResults: number
  executionTimeMs: number
  sources: {
    rag: boolean
    live: boolean
  }
}

export interface DatabaseStatus {
  status: "connected" | "error" | "initializing"
  tables: string[]
  counts: Record<string, number>
  timestamp: string
  error?: string
}

// Form types
export interface DocumentUploadForm {
  title: string
  file: File
  documentType: string
  jurisdiction?: string
  practiceArea?: string
  description?: string
}

export interface SearchForm {
  query: string
  jurisdiction?: string
  practiceArea?: string
  documentType?: string
  dateFrom?: string
  dateTo?: string
  useRAG?: boolean
  useLiveSources?: boolean
}

export interface AnalysisForm {
  documentId: string
  analysisType: DocumentAnalysis["analysisType"]
  options?: Record<string, any>
}
