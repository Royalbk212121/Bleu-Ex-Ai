// Legal platform constants

export const PRACTICE_AREAS = [
  { code: "CONST", name: "Constitutional Law" },
  { code: "CRIM", name: "Criminal Law" },
  { code: "CIVIL", name: "Civil Rights" },
  { code: "CONTRACT", name: "Contract Law" },
  { code: "TORT", name: "Tort Law" },
  { code: "PROPERTY", name: "Property Law" },
  { code: "FAMILY", name: "Family Law" },
  { code: "EMPLOY", name: "Employment Law" },
  { code: "CORP", name: "Corporate Law" },
  { code: "SEC", name: "Securities Law" },
  { code: "TAX", name: "Tax Law" },
  { code: "IMMIG", name: "Immigration Law" },
  { code: "ENV", name: "Environmental Law" },
  { code: "HEALTH", name: "Health Law" },
  { code: "IP", name: "Intellectual Property" },
  { code: "BANK", name: "Bankruptcy Law" },
  { code: "ADMIN", name: "Administrative Law" },
  { code: "EVID", name: "Evidence Law" },
  { code: "APP", name: "Appellate Practice" },
  { code: "LIT", name: "Litigation" },
] as const

export const JURISDICTIONS = [
  { code: "US", name: "United States", type: "federal" },
  { code: "AL", name: "Alabama", type: "state" },
  { code: "AK", name: "Alaska", type: "state" },
  { code: "AZ", name: "Arizona", type: "state" },
  { code: "AR", name: "Arkansas", type: "state" },
  { code: "CA", name: "California", type: "state" },
  { code: "CO", name: "Colorado", type: "state" },
  { code: "CT", name: "Connecticut", type: "state" },
  { code: "DE", name: "Delaware", type: "state" },
  { code: "FL", name: "Florida", type: "state" },
  { code: "GA", name: "Georgia", type: "state" },
  { code: "HI", name: "Hawaii", type: "state" },
  { code: "ID", name: "Idaho", type: "state" },
  { code: "IL", name: "Illinois", type: "state" },
  { code: "IN", name: "Indiana", type: "state" },
  { code: "IA", name: "Iowa", type: "state" },
  { code: "KS", name: "Kansas", type: "state" },
  { code: "KY", name: "Kentucky", type: "state" },
  { code: "LA", name: "Louisiana", type: "state" },
  { code: "ME", name: "Maine", type: "state" },
  { code: "MD", name: "Maryland", type: "state" },
  { code: "MA", name: "Massachusetts", type: "state" },
  { code: "MI", name: "Michigan", type: "state" },
  { code: "MN", name: "Minnesota", type: "state" },
  { code: "MS", name: "Mississippi", type: "state" },
  { code: "MO", name: "Missouri", type: "state" },
  { code: "MT", name: "Montana", type: "state" },
  { code: "NE", name: "Nebraska", type: "state" },
  { code: "NV", name: "Nevada", type: "state" },
  { code: "NH", name: "New Hampshire", type: "state" },
  { code: "NJ", name: "New Jersey", type: "state" },
  { code: "NM", name: "New Mexico", type: "state" },
  { code: "NY", name: "New York", type: "state" },
  { code: "NC", name: "North Carolina", type: "state" },
  { code: "ND", name: "North Dakota", type: "state" },
  { code: "OH", name: "Ohio", type: "state" },
  { code: "OK", name: "Oklahoma", type: "state" },
  { code: "OR", name: "Oregon", type: "state" },
  { code: "PA", name: "Pennsylvania", type: "state" },
  { code: "RI", name: "Rhode Island", type: "state" },
  { code: "SC", name: "South Carolina", type: "state" },
  { code: "SD", name: "South Dakota", type: "state" },
  { code: "TN", name: "Tennessee", type: "state" },
  { code: "TX", name: "Texas", type: "state" },
  { code: "UT", name: "Utah", type: "state" },
  { code: "VT", name: "Vermont", type: "state" },
  { code: "VA", name: "Virginia", type: "state" },
  { code: "WA", name: "Washington", type: "state" },
  { code: "WV", name: "West Virginia", type: "state" },
  { code: "WI", name: "Wisconsin", type: "state" },
  { code: "WY", name: "Wyoming", type: "state" },
  { code: "DC", name: "District of Columbia", type: "federal_district" },
] as const

export const DOCUMENT_TYPES = [
  { code: "SCOTUS", name: "Supreme Court Opinion", category: "case_law" },
  { code: "FED_COURT", name: "Federal Court Opinion", category: "case_law" },
  { code: "STATE_COURT", name: "State Court Opinion", category: "case_law" },
  { code: "FED_STAT", name: "Federal Statute", category: "statute" },
  { code: "STATE_STAT", name: "State Statute", category: "statute" },
  { code: "FED_REG", name: "Federal Regulation", category: "regulation" },
  { code: "STATE_REG", name: "State Regulation", category: "regulation" },
  { code: "BRIEF", name: "Legal Brief", category: "brief" },
  { code: "CONTRACT", name: "Contract", category: "contract" },
  { code: "MEMO", name: "Legal Memo", category: "memo" },
  { code: "PLEADING", name: "Pleading", category: "pleading" },
  { code: "DISCOVERY", name: "Discovery Document", category: "discovery" },
  { code: "SETTLEMENT", name: "Settlement Agreement", category: "settlement" },
  { code: "OPINION", name: "Legal Opinion", category: "opinion" },
  { code: "REG_FILING", name: "Regulatory Filing", category: "filing" },
] as const

export const LEGAL_SOURCES = [
  { code: "GOOGLE_SCHOLAR", name: "Google Scholar", type: "free" },
  { code: "JUSTIA", name: "Justia", type: "free" },
  { code: "COURT_LISTENER", name: "CourtListener", type: "free" },
  { code: "LII", name: "Legal Information Institute", type: "free" },
  { code: "FINDLAW", name: "FindLaw", type: "free" },
  { code: "OPENJURIST", name: "OpenJurist", type: "free" },
  { code: "CASETEXT", name: "Casetext", type: "subscription" },
  { code: "USCOURTS", name: "US Courts", type: "free" },
] as const

export const ANALYSIS_TYPES = [
  { code: "risk_assessment", name: "Risk Assessment" },
  { code: "contract_review", name: "Contract Review" },
  { code: "privilege_review", name: "Privilege Review" },
  { code: "compliance_check", name: "Compliance Check" },
] as const

export const RISK_LEVELS = [
  { code: "low", name: "Low Risk", color: "green" },
  { code: "medium", name: "Medium Risk", color: "yellow" },
  { code: "high", name: "High Risk", color: "orange" },
  { code: "critical", name: "Critical Risk", color: "red" },
] as const

export const SUBSCRIPTION_TIERS = [
  { code: "free", name: "Free", features: ["Basic search", "Document upload", "Limited AI analysis"] },
  {
    code: "professional",
    name: "Professional",
    features: ["Advanced search", "Unlimited uploads", "Full AI analysis", "Citation tools"],
  },
  {
    code: "enterprise",
    name: "Enterprise",
    features: ["All features", "Custom integrations", "Priority support", "Team management"],
  },
] as const

// API Configuration
export const API_ENDPOINTS = {
  DOCUMENTS: "/api/documents",
  SEARCH: "/api/legal-search",
  ANALYSIS: "/api/documents/analyze",
  RAG: "/api/rag",
  CHAT: "/api/chat",
  LEGAL_SOURCES: "/api/legal-sources",
} as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const SUPPORTED_FILE_TYPES = [".pdf", ".docx", ".txt", ".md"] as const

export const EMBEDDING_DIMENSIONS = 768
export const MAX_CHUNK_SIZE = 25000 // 25KB
export const DEFAULT_SEARCH_LIMIT = 50

// Citation patterns for legal documents
export const CITATION_PATTERNS = {
  SUPREME_COURT: /\d+\s+U\.S\.?\s+\d+/g,
  FEDERAL_CASES: /\d+\s+F\.\d+d?\s+\d+/g,
  US_CODE: /\d+\s+U\.S\.C\.?\s+§?\s*\d+/g,
  CFR: /\d+\s+C\.F\.R\.?\s+§?\s*\d+/g,
  STATE_CASES: /\d+\s+[A-Z][a-z]*\.?\s*\d*d?\s+\d+/g,
} as const

// Error messages
export const ERROR_MESSAGES = {
  UPLOAD_FAILED: "Failed to upload document. Please try again.",
  SEARCH_FAILED: "Search request failed. Please try again.",
  ANALYSIS_FAILED: "Document analysis failed. Please try again.",
  DATABASE_ERROR: "Database connection error. Please contact support.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FILE_TOO_LARGE: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`,
  UNSUPPORTED_FILE_TYPE: `Unsupported file type. Please use: ${SUPPORTED_FILE_TYPES.join(", ")}`,
} as const
