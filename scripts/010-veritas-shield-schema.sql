-- VeritasShield™ Database Schema
-- Fiduciary AI & Absolute Validation Layer

-- Validation records table
CREATE TABLE IF NOT EXISTS veritas_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash TEXT NOT NULL,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    validation_result JSONB NOT NULL,
    blockchain_hash TEXT,
    requires_human_review BOOLEAN DEFAULT FALSE,
    human_reviewed BOOLEAN DEFAULT FALSE,
    human_decision TEXT CHECK (human_decision IN ('approve', 'reject', 'modify', 'escalate')),
    human_confidence_override INTEGER CHECK (human_confidence_override >= 0 AND human_confidence_override <= 100),
    human_reasoning TEXT,
    processing_time_ms INTEGER,
    hitl_task_id TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Citation validation records
CREATE TABLE IF NOT EXISTS citation_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citation_id TEXT NOT NULL,
    original_citation TEXT NOT NULL,
    validation_status TEXT NOT NULL CHECK (validation_status IN ('valid', 'invalid', 'suspicious', 'corrected')),
    semantic_similarity DECIMAL(3,2) CHECK (semantic_similarity >= 0 AND semantic_similarity <= 1),
    textual_match BOOLEAN DEFAULT FALSE,
    authority_score INTEGER CHECK (authority_score >= 0 AND authority_score <= 100),
    cryptographic_hash TEXT,
    corrected_citation TEXT,
    source_document_id TEXT,
    validation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Citation validation reports
CREATE TABLE IF NOT EXISTS citation_validation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_citations INTEGER NOT NULL,
    valid_citations INTEGER NOT NULL,
    invalid_citations INTEGER NOT NULL,
    suspicious_citations INTEGER NOT NULL,
    corrected_citations INTEGER NOT NULL,
    overall_accuracy INTEGER CHECK (overall_accuracy >= 0 AND overall_accuracy <= 100),
    recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Human-in-the-Loop tasks
CREATE TABLE IF NOT EXISTS hitl_tasks (
    id TEXT PRIMARY KEY,
    task_type TEXT NOT NULL CHECK (task_type IN ('validation', 'correction', 'review', 'approval')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    content TEXT NOT NULL,
    confidence_score JSONB,
    flagged_issues JSONB,
    assigned_to TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'escalated')),
    deadline TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HITL reviews
CREATE TABLE IF NOT EXISTS hitl_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT NOT NULL REFERENCES hitl_tasks(id),
    reviewer_id TEXT NOT NULL,
    reviewer_name TEXT,
    decision TEXT NOT NULL CHECK (decision IN ('approve', 'reject', 'modify', 'escalate')),
    modifications TEXT,
    reasoning TEXT NOT NULL,
    confidence_override INTEGER CHECK (confidence_override >= 0 AND confidence_override <= 100),
    time_spent_minutes INTEGER,
    review_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HITL workflows
CREATE TABLE IF NOT EXISTS hitl_workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    trigger_conditions JSONB NOT NULL,
    assignment_rules JSONB NOT NULL,
    escalation_rules JSONB,
    sla_hours INTEGER DEFAULT 24,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adversarial training records
CREATE TABLE IF NOT EXISTS adversarial_training (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_type TEXT NOT NULL CHECK (training_type IN ('hallucination', 'logical_fallacy', 'bias', 'factual_error')),
    adversarial_prompt TEXT NOT NULL,
    expected_response TEXT NOT NULL,
    model_response TEXT,
    success_rate DECIMAL(3,2) CHECK (success_rate >= 0 AND success_rate <= 1),
    training_round INTEGER,
    model_version TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Confidence score tracking
CREATE TABLE IF NOT EXISTS confidence_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash TEXT NOT NULL,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    source_quality INTEGER CHECK (source_quality >= 0 AND source_quality <= 100),
    source_quantity INTEGER CHECK (source_quantity >= 0 AND source_quantity <= 100),
    semantic_alignment INTEGER CHECK (semantic_alignment >= 0 AND semantic_alignment <= 100),
    authority_level INTEGER CHECK (authority_level >= 0 AND authority_level <= 100),
    recency INTEGER CHECK (recency >= 0 AND recency <= 100),
    consensus INTEGER CHECK (consensus >= 0 AND consensus <= 100),
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evidence chains
CREATE TABLE IF NOT EXISTS evidence_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    validation_id UUID REFERENCES veritas_validations(id),
    claim_id TEXT NOT NULL,
    claim TEXT NOT NULL,
    supporting_source_id TEXT NOT NULL,
    source_title TEXT NOT NULL,
    source_url TEXT,
    relevant_passage TEXT NOT NULL,
    support_strength DECIMAL(3,2) CHECK (support_strength >= 0 AND support_strength <= 1),
    hyperlink TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blockchain validation hashes
CREATE TABLE IF NOT EXISTS blockchain_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    validation_hash TEXT UNIQUE NOT NULL,
    content_hash TEXT NOT NULL,
    source_hashes TEXT[],
    confidence_score INTEGER,
    timestamp_ms BIGINT NOT NULL,
    block_number BIGINT,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_veritas_validations_content_hash ON veritas_validations(content_hash);
CREATE INDEX IF NOT EXISTS idx_veritas_validations_confidence ON veritas_validations(confidence_score);
CREATE INDEX IF NOT EXISTS idx_veritas_validations_human_review ON veritas_validations(requires_human_review);
CREATE INDEX IF NOT EXISTS idx_veritas_validations_created_at ON veritas_validations(created_at);

CREATE INDEX IF NOT EXISTS idx_citation_validations_status ON citation_validations(validation_status);
CREATE INDEX IF NOT EXISTS idx_citation_validations_timestamp ON citation_validations(validation_timestamp);

CREATE INDEX IF NOT EXISTS idx_hitl_tasks_status ON hitl_tasks(status);
CREATE INDEX IF NOT EXISTS idx_hitl_tasks_priority ON hitl_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_hitl_tasks_assigned_to ON hitl_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_hitl_tasks_deadline ON hitl_tasks(deadline);

CREATE INDEX IF NOT EXISTS idx_hitl_reviews_task_id ON hitl_reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_hitl_reviews_reviewer_id ON hitl_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_hitl_reviews_decision ON hitl_reviews(decision);

CREATE INDEX IF NOT EXISTS idx_evidence_chains_validation_id ON evidence_chains(validation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_chains_support_strength ON evidence_chains(support_strength);

CREATE INDEX IF NOT EXISTS idx_blockchain_validations_hash ON blockchain_validations(validation_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_validations_timestamp ON blockchain_validations(timestamp_ms);

-- Create functions for validation operations
CREATE OR REPLACE FUNCTION get_validation_metrics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_validations BIGINT,
    avg_confidence_score DECIMAL,
    human_review_rate DECIMAL,
    accuracy_rate DECIMAL,
    processing_time_avg DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_validations,
        AVG(confidence_score)::DECIMAL as avg_confidence_score,
        (COUNT(*) FILTER (WHERE requires_human_review) * 100.0 / COUNT(*))::DECIMAL as human_review_rate,
        (COUNT(*) FILTER (WHERE confidence_score >= 75) * 100.0 / COUNT(*))::DECIMAL as accuracy_rate,
        AVG(processing_time_ms)::DECIMAL as processing_time_avg
    FROM veritas_validations
    WHERE created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get HITL metrics
CREATE OR REPLACE FUNCTION get_hitl_metrics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_tasks BIGINT,
    pending_tasks BIGINT,
    completed_tasks BIGINT,
    avg_resolution_hours DECIMAL,
    escalation_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) FILTER (WHERE completed_at IS NOT NULL)::DECIMAL as avg_resolution_hours,
        (COUNT(*) FILTER (WHERE status = 'escalated') * 100.0 / COUNT(*))::DECIMAL as escalation_rate
    FROM hitl_tasks
    WHERE created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert default HITL workflow
INSERT INTO hitl_workflows (id, name, description, trigger_conditions, assignment_rules, sla_hours, is_active)
VALUES (
    'default_validation_workflow',
    'Default Validation Workflow',
    'Standard workflow for content requiring human validation',
    '[
        {"type": "confidence_threshold", "threshold": 75, "priority": "medium"},
        {"type": "flag_severity", "condition": "high", "priority": "high"},
        {"type": "flag_severity", "condition": "critical", "priority": "urgent"}
    ]'::jsonb,
    '[
        {"condition": "priority=urgent", "assigneeType": "role", "assigneeId": "senior_reviewer", "priority": 1},
        {"condition": "priority=high", "assigneeType": "role", "assigneeId": "reviewer", "priority": 2},
        {"condition": "default", "assigneeType": "pool", "assigneeId": "review_pool", "priority": 3}
    ]'::jsonb,
    24,
    true
) ON CONFLICT (id) DO NOTHING;
