-- Legal AI Platform Database Schema
-- Create comprehensive database for legal documents, cases, and research

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    subscription_tier VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal Jurisdictions
CREATE TABLE IF NOT EXISTS jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    country VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- federal, state, local, international
    parent_id UUID REFERENCES jurisdictions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal Practice Areas
CREATE TABLE IF NOT EXISTS practice_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES practice_areas(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal Document Types
CREATE TABLE IF NOT EXISTS document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100), -- case_law, statute, regulation, brief, contract, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal Cases
CREATE TABLE IF NOT EXISTS legal_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_name VARCHAR(500) NOT NULL,
    case_number VARCHAR(255),
    court VARCHAR(255) NOT NULL,
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    decision_date DATE,
    filing_date DATE,
    case_type VARCHAR(100),
    status VARCHAR(50),
    citation VARCHAR(255),
    docket_number VARCHAR(255),
    judges TEXT[], -- Array of judge names
    parties JSONB, -- Plaintiff, defendant, etc.
    summary TEXT,
    outcome VARCHAR(255),
    precedential_value VARCHAR(50), -- binding, persuasive, non-precedential
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal Documents
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    document_type_id UUID REFERENCES document_types(id),
    case_id UUID REFERENCES legal_cases(id),
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    practice_area_id UUID REFERENCES practice_areas(id),
    user_id UUID REFERENCES users(id),
    file_url VARCHAR(500),
    file_size BIGINT,
    file_type VARCHAR(50),
    content TEXT,
    summary TEXT,
    key_terms TEXT[],
    citations TEXT[],
    publication_date DATE,
    effective_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    source VARCHAR(255), -- google_scholar, justia, etc.
    source_url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal Citations
CREATE TABLE IF NOT EXISTS legal_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citing_document_id UUID REFERENCES legal_documents(id),
    cited_document_id UUID REFERENCES legal_documents(id),
    cited_case_id UUID REFERENCES legal_cases(id),
    citation_text VARCHAR(500) NOT NULL,
    citation_type VARCHAR(50), -- case, statute, regulation, secondary
    context TEXT,
    page_number INTEGER,
    treatment VARCHAR(50), -- followed, distinguished, overruled, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal Statutes and Regulations
CREATE TABLE IF NOT EXISTS legal_statutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    code VARCHAR(255) NOT NULL,
    section VARCHAR(255),
    subsection VARCHAR(255),
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    practice_area_id UUID REFERENCES practice_areas(id),
    content TEXT NOT NULL,
    summary TEXT,
    effective_date DATE,
    expiration_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    source VARCHAR(255),
    source_url VARCHAR(500),
    parent_statute_id UUID REFERENCES legal_statutes(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal Research Queries
CREATE TABLE IF NOT EXISTS research_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    query_text TEXT NOT NULL,
    query_type VARCHAR(50), -- case_law, statute, general
    jurisdiction_filter UUID REFERENCES jurisdictions(id),
    practice_area_filter UUID REFERENCES practice_areas(id),
    date_range_start DATE,
    date_range_end DATE,
    results_count INTEGER,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Analysis Results
CREATE TABLE IF NOT EXISTS document_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES legal_documents(id),
    user_id UUID REFERENCES users(id),
    analysis_type VARCHAR(50), -- risk_assessment, contract_review, privilege_review
    risk_level VARCHAR(20),
    confidence_score DECIMAL(3,2),
    issues_found INTEGER,
    key_findings JSONB,
    recommendations JSONB,
    ai_model VARCHAR(100),
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vector Embeddings for RAG
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES legal_documents(id),
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(768), -- For Google's embedding model
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal Library Sources
CREATE TABLE IF NOT EXISTS legal_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    base_url VARCHAR(500),
    api_endpoint VARCHAR(500),
    access_type VARCHAR(50), -- free, subscription, api_key
    rate_limit INTEGER,
    supported_jurisdictions UUID[],
    supported_document_types UUID[],
    last_sync TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_legal_documents_user_id ON legal_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_case_id ON legal_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_jurisdiction ON legal_documents(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_practice_area ON legal_documents(practice_area_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_source ON legal_documents(source);
CREATE INDEX IF NOT EXISTS idx_legal_cases_jurisdiction ON legal_cases(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_decision_date ON legal_cases(decision_date);
CREATE INDEX IF NOT EXISTS idx_legal_statutes_jurisdiction ON legal_statutes(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_legal_statutes_code ON legal_statutes(code);
CREATE INDEX IF NOT EXISTS idx_research_queries_user_id ON research_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_document_analyses_document_id ON document_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id ON document_embeddings(document_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_legal_documents_content_fts ON legal_documents USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_legal_cases_name_fts ON legal_cases USING gin(to_tsvector('english', case_name));
CREATE INDEX IF NOT EXISTS idx_legal_statutes_content_fts ON legal_statutes USING gin(to_tsvector('english', content));
