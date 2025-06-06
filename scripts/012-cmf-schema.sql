-- Cognitive Matter Fabric™ (CMF) Database Schema
-- The Living Brain of Every Legal Case

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Matters table - Core legal matters
CREATE TABLE IF NOT EXISTS matters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    matter_number VARCHAR(100) UNIQUE NOT NULL,
    client VARCHAR(255) NOT NULL,
    matter_type VARCHAR(50) NOT NULL CHECK (matter_type IN ('litigation', 'transaction', 'advisory', 'compliance', 'regulatory')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'on_hold', 'archived')),
    practice_area VARCHAR(100) NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL,
    assigned_attorneys TEXT[] NOT NULL DEFAULT '{}',
    lead_attorney VARCHAR(255) NOT NULL,
    budget DECIMAL(15,2) DEFAULT 0,
    billed_amount DECIMAL(15,2) DEFAULT 0,
    risk_score INTEGER DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    open_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    target_close_date TIMESTAMP WITH TIME ZONE,
    actual_close_date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    objectives TEXT[],
    key_issues TEXT[],
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(1536), -- For semantic search
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matter entities - Knowledge graph nodes
CREATE TABLE IF NOT EXISTS matter_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('person', 'organization', 'asset', 'location', 'concept', 'event', 'document')),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    properties JSONB DEFAULT '{}',
    coordinates JSONB, -- For graph visualization {x, y, z}
    importance DECIMAL(3,2) DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
    first_mentioned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    embedding VECTOR(1536), -- For semantic search
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matter relationships - Knowledge graph edges
CREATE TABLE IF NOT EXISTS matter_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    source_entity_id UUID NOT NULL REFERENCES matter_entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES matter_entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL,
    strength DECIMAL(3,2) DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
    confidence DECIMAL(3,2) DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
    evidence TEXT[],
    temporal JSONB DEFAULT '{}', -- {startDate, endDate, duration}
    spatial JSONB DEFAULT '{}', -- {location, coordinates}
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matter documents - Unified document repository
CREATE TABLE IF NOT EXISTS matter_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_url TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES matter_documents(id),
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    ocr_text TEXT,
    transcription TEXT,
    metadata JSONB DEFAULT '{}', -- Rich metadata and tags
    audit_trail JSONB DEFAULT '[]', -- Immutable audit trail
    embedding VECTOR(1536), -- For semantic search
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matter risk assessments - Dynamic risk scoring
CREATE TABLE IF NOT EXISTS matter_risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    categories JSONB NOT NULL, -- {legal, financial, reputational, operational}
    trends JSONB DEFAULT '[]', -- Historical risk score changes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(matter_id, last_updated)
);

-- Matter insights - Predictive analytics and alerts
CREATE TABLE IF NOT EXISTS matter_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('deadline_alert', 'precedent_change', 'risk_escalation', 'opportunity', 'resource_optimization')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    impact VARCHAR(20) NOT NULL CHECK (impact IN ('low', 'medium', 'high', 'critical')),
    recommended_actions TEXT[],
    evidence JSONB DEFAULT '[]',
    trigger_conditions JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matter financial tracking - Budget and billing
CREATE TABLE IF NOT EXISTS matter_financial_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('time', 'expense', 'budget_adjustment')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    attorney VARCHAR(255),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    billable BOOLEAN DEFAULT true,
    billed BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matter timeline - Key events and milestones
CREATE TABLE IF NOT EXISTS matter_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    participants TEXT[],
    documents UUID[],
    location VARCHAR(255),
    importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matter communications - All communications related to matter
CREATE TABLE IF NOT EXISTS matter_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    communication_type VARCHAR(50) NOT NULL CHECK (communication_type IN ('email', 'call', 'meeting', 'letter', 'filing')),
    subject VARCHAR(500),
    content TEXT,
    participants TEXT[] NOT NULL,
    direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound', 'internal')),
    communication_date TIMESTAMP WITH TIME ZONE NOT NULL,
    attachments UUID[],
    privilege_status VARCHAR(50) DEFAULT 'under_review',
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matters_client ON matters(client);
CREATE INDEX IF NOT EXISTS idx_matters_status ON matters(status);
CREATE INDEX IF NOT EXISTS idx_matters_risk_score ON matters(risk_score);
CREATE INDEX IF NOT EXISTS idx_matters_assigned_attorneys ON matters USING GIN(assigned_attorneys);
CREATE INDEX IF NOT EXISTS idx_matters_embedding ON matters USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_matter_entities_matter_id ON matter_entities(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_entities_type ON matter_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_matter_entities_name ON matter_entities(name);
CREATE INDEX IF NOT EXISTS idx_matter_entities_embedding ON matter_entities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_matter_relationships_matter_id ON matter_relationships(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_relationships_source ON matter_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_matter_relationships_target ON matter_relationships(target_entity_id);

CREATE INDEX IF NOT EXISTS idx_matter_documents_matter_id ON matter_documents(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_documents_type ON matter_documents(file_type);
CREATE INDEX IF NOT EXISTS idx_matter_documents_uploaded_at ON matter_documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_matter_documents_embedding ON matter_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_matter_insights_matter_id ON matter_insights(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_insights_priority ON matter_insights(priority);
CREATE INDEX IF NOT EXISTS idx_matter_insights_acknowledged ON matter_insights(acknowledged_at);

CREATE INDEX IF NOT EXISTS idx_matter_financial_matter_id ON matter_financial_entries(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_financial_date ON matter_financial_entries(date);
CREATE INDEX IF NOT EXISTS idx_matter_financial_billable ON matter_financial_entries(billable);

CREATE INDEX IF NOT EXISTS idx_matter_timeline_matter_id ON matter_timeline(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_timeline_date ON matter_timeline(event_date);

CREATE INDEX IF NOT EXISTS idx_matter_communications_matter_id ON matter_communications(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_communications_date ON matter_communications(communication_date);
CREATE INDEX IF NOT EXISTS idx_matter_communications_embedding ON matter_communications USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create functions for vector search
CREATE OR REPLACE FUNCTION search_matters(
    query_embedding vector(1536),
    user_id text DEFAULT NULL,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 20
)
RETURNS TABLE (
    id uuid,
    name varchar,
    matter_number varchar,
    client varchar,
    matter_type varchar,
    status varchar,
    risk_score integer,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.matter_number,
        m.client,
        m.matter_type,
        m.status,
        m.risk_score,
        (m.embedding <=> query_embedding) * -1 + 1 as similarity
    FROM matters m
    WHERE 
        (user_id IS NULL OR m.lead_attorney = user_id OR user_id = ANY(m.assigned_attorneys))
        AND (m.embedding <=> query_embedding) < (1 - match_threshold)
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION search_matter_entities(
    matter_id uuid,
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 20
)
RETURNS TABLE (
    id uuid,
    entity_type varchar,
    name varchar,
    description text,
    importance decimal,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.entity_type,
        e.name,
        e.description,
        e.importance,
        (e.embedding <=> query_embedding) * -1 + 1 as similarity
    FROM matter_entities e
    WHERE 
        e.matter_id = search_matter_entities.matter_id
        AND (e.embedding <=> query_embedding) < (1 - match_threshold)
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_matters_updated_at BEFORE UPDATE ON matters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_communications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on requirements)
CREATE POLICY "Users can access matters they are assigned to" ON matters
    FOR ALL USING (
        auth.uid()::text = lead_attorney OR 
        auth.uid()::text = ANY(assigned_attorneys)
    );

CREATE POLICY "Users can access entities for their matters" ON matter_entities
    FOR ALL USING (
        matter_id IN (
            SELECT id FROM matters 
            WHERE auth.uid()::text = lead_attorney OR auth.uid()::text = ANY(assigned_attorneys)
        )
    );

-- Apply similar policies to other tables
CREATE POLICY "Users can access relationships for their matters" ON matter_relationships
    FOR ALL USING (
        matter_id IN (
            SELECT id FROM matters 
            WHERE auth.uid()::text = lead_attorney OR auth.uid()::text = ANY(assigned_attorneys)
        )
    );

CREATE POLICY "Users can access documents for their matters" ON matter_documents
    FOR ALL USING (
        matter_id IN (
            SELECT id FROM matters 
            WHERE auth.uid()::text = lead_attorney OR auth.uid()::text = ANY(assigned_attorneys)
        )
    );

CREATE POLICY "Users can access risk assessments for their matters" ON matter_risk_assessments
    FOR ALL USING (
        matter_id IN (
            SELECT id FROM matters 
            WHERE auth.uid()::text = lead_attorney OR auth.uid()::text = ANY(assigned_attorneys)
        )
    );

CREATE POLICY "Users can access insights for their matters" ON matter_insights
    FOR ALL USING (
        matter_id IN (
            SELECT id FROM matters 
            WHERE auth.uid()::text = lead_attorney OR auth.uid()::text = ANY(assigned_attorneys)
        )
    );

CREATE POLICY "Users can access financial entries for their matters" ON matter_financial_entries
    FOR ALL USING (
        matter_id IN (
            SELECT id FROM matters 
            WHERE auth.uid()::text = lead_attorney OR auth.uid()::text = ANY(assigned_attorneys)
        )
    );

CREATE POLICY "Users can access timeline for their matters" ON matter_timeline
    FOR ALL USING (
        matter_id IN (
            SELECT id FROM matters 
            WHERE auth.uid()::text = lead_attorney OR auth.uid()::text = ANY(assigned_attorneys)
        )
    );

CREATE POLICY "Users can access communications for their matters" ON matter_communications
    FOR ALL USING (
        matter_id IN (
            SELECT id FROM matters 
            WHERE auth.uid()::text = lead_attorney OR auth.uid()::text = ANY(assigned_attorneys)
        )
    );
