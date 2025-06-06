-- LexiconOmni™ Knowledge Graph Schema
-- This schema supports the advanced legal knowledge graph and multi-modal data repository

-- Legal entities table (people, organizations, courts, etc.)
CREATE TABLE IF NOT EXISTS legal_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('person', 'organization', 'court', 'government_body', 'company', 'law_firm')),
    name TEXT NOT NULL,
    canonical_id TEXT UNIQUE,
    aliases TEXT[],
    description TEXT,
    metadata JSONB DEFAULT '{}',
    external_ids JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal concepts ontology
CREATE TABLE IF NOT EXISTS legal_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_name TEXT NOT NULL,
    concept_type VARCHAR(50) NOT NULL CHECK (concept_type IN ('doctrine', 'principle', 'rule', 'standard', 'test', 'theory', 'element')),
    definition TEXT NOT NULL,
    parent_concept_id UUID REFERENCES legal_concepts(id),
    related_concepts UUID[],
    jurisdictions TEXT[],
    practice_areas TEXT[],
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal relationships (for knowledge graph connections)
CREATE TABLE IF NOT EXISTS legal_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL,
    source_id UUID NOT NULL,
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
        'cites', 'overrules', 'distinguishes', 'follows', 'criticizes',
        'authored_by', 'represents', 'presides_over', 'parent_of', 'child_of',
        'incorporates', 'amends', 'supersedes', 'interprets', 'applies'
    )),
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    confidence_score DECIMAL(5,4),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal events timeline
CREATE TABLE IF NOT EXISTS legal_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL,
    entities UUID[] REFERENCES legal_entities(id),
    documents UUID[] REFERENCES legal_documents(id),
    cases UUID[] REFERENCES legal_cases(id),
    location JSONB,
    importance_score DECIMAL(3,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Semantic tags for advanced document tagging
CREATE TABLE IF NOT EXISTS semantic_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name TEXT NOT NULL,
    tag_category VARCHAR(50) NOT NULL,
    description TEXT,
    parent_tag_id UUID REFERENCES semantic_tags(id),
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document semantic tagging junction table
CREATE TABLE IF NOT EXISTS document_semantic_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES semantic_tags(id) ON DELETE CASCADE,
    confidence_score DECIMAL(5,4) NOT NULL,
    context_snippet TEXT,
    location_in_document JSONB, -- Page, paragraph, character offsets
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal precedent influence mapping
CREATE TABLE IF NOT EXISTS precedent_influence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES legal_cases(id) ON DELETE CASCADE,
    influenced_case_id UUID REFERENCES legal_cases(id) ON DELETE CASCADE,
    influence_type VARCHAR(50) NOT NULL CHECK (influence_type IN ('direct_citation', 'indirect_citation', 'conceptual_influence', 'doctrinal_evolution')),
    influence_strength DECIMAL(5,4) NOT NULL,
    influence_description TEXT,
    detected_by VARCHAR(50) NOT NULL DEFAULT 'ai_analysis',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multi-modal content storage (for images, audio, video within legal documents)
CREATE TABLE IF NOT EXISTS multimodal_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('image', 'audio', 'video', 'chart', 'table', 'signature')),
    content_location JSONB NOT NULL, -- Page, coordinates
    blob_url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT,
    extracted_text TEXT,
    ai_description TEXT,
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Language translations for multilingual support
CREATE TABLE IF NOT EXISTS document_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    translated_content TEXT NOT NULL,
    translation_method VARCHAR(50) NOT NULL DEFAULT 'ai',
    quality_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time data stream integration
CREATE TABLE IF NOT EXISTS external_data_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_type VARCHAR(50) NOT NULL CHECK (stream_type IN ('financial', 'news', 'regulatory', 'social', 'corporate_filing')),
    source_name TEXT NOT NULL,
    data_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    content JSONB NOT NULL,
    entities UUID[] REFERENCES legal_entities(id),
    relevance_score DECIMAL(3,2),
    sentiment_score DECIMAL(3,2),
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for knowledge graph queries
CREATE INDEX IF NOT EXISTS idx_legal_entities_type ON legal_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_legal_entities_name ON legal_entities USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_legal_concepts_name ON legal_concepts USING gin(to_tsvector('english', concept_name));
CREATE INDEX IF NOT EXISTS idx_legal_concepts_embedding ON legal_concepts USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_legal_relationships_source ON legal_relationships(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_legal_relationships_target ON legal_relationships(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_legal_events_date ON legal_events(event_date);
CREATE INDEX IF NOT EXISTS idx_document_semantic_tags_document ON document_semantic_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_semantic_tags_tag ON document_semantic_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_precedent_influence_case ON precedent_influence(case_id);
CREATE INDEX IF NOT EXISTS idx_precedent_influence_influenced ON precedent_influence(influenced_case_id);
CREATE INDEX IF NOT EXISTS idx_multimodal_content_document ON multimodal_content(document_id);
CREATE INDEX IF NOT EXISTS idx_multimodal_content_embedding ON multimodal_content USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_external_data_streams_timestamp ON external_data_streams(data_timestamp);
CREATE INDEX IF NOT EXISTS idx_external_data_streams_embedding ON external_data_streams USING ivfflat (embedding vector_cosine_ops);
