-- Multi-Agent Cognitive Swarm (ArbiterNet™) Database Schema

-- Agent registry and metadata
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL UNIQUE,
    agent_type TEXT NOT NULL,
    specialization TEXT NOT NULL,
    description TEXT,
    capabilities TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'training', 'maintenance')),
    version TEXT DEFAULT '1.0.0',
    model_config JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent communication logs
CREATE TABLE IF NOT EXISTS agent_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    sender_agent_id UUID REFERENCES ai_agents(id),
    receiver_agent_id UUID REFERENCES ai_agents(id),
    message_type TEXT NOT NULL,
    message_content JSONB NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'received', 'processed', 'failed')),
    response_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent task assignments and execution
CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    assigned_agent_id UUID REFERENCES ai_agents(id),
    task_type TEXT NOT NULL,
    task_description TEXT NOT NULL,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_time_ms INTEGER,
    confidence_score DECIMAL(3,2),
    validation_status TEXT CHECK (validation_status IN ('pending', 'validated', 'rejected', 'needs_review')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent collaboration sessions
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    session_name TEXT,
    session_type TEXT NOT NULL,
    primary_agent_id UUID REFERENCES ai_agents(id),
    participating_agents UUID[],
    session_context JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_execution_time_ms INTEGER DEFAULT 0
);

-- Agent learning and feedback
CREATE TABLE IF NOT EXISTS agent_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES ai_agents(id),
    session_id UUID REFERENCES agent_sessions(id),
    task_id UUID REFERENCES agent_tasks(id),
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('user_rating', 'peer_review', 'validation_result', 'performance_metric')),
    feedback_score DECIMAL(3,2),
    feedback_content TEXT,
    improvement_suggestions TEXT[],
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent knowledge base and specializations
CREATE TABLE IF NOT EXISTS agent_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES ai_agents(id),
    knowledge_type TEXT NOT NULL,
    knowledge_domain TEXT NOT NULL,
    knowledge_content JSONB NOT NULL,
    confidence_level DECIMAL(3,2) DEFAULT 0.80,
    source_documents UUID[],
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent consensus and conflict resolution
CREATE TABLE IF NOT EXISTS agent_consensus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES agent_sessions(id),
    consensus_topic TEXT NOT NULL,
    participating_agents UUID[],
    agent_positions JSONB NOT NULL,
    consensus_reached BOOLEAN DEFAULT false,
    final_decision JSONB,
    confidence_score DECIMAL(3,2),
    resolution_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_communications_session ON agent_communications(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_session ON agent_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON agent_tasks(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_agent ON agent_feedback(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_agent ON agent_knowledge(agent_id);

-- Insert the core AI agents
INSERT INTO ai_agents (agent_name, agent_type, specialization, description, capabilities) VALUES
('orchestrator', 'coordinator', 'workflow_management', 'Primary controller that dispatches tasks, monitors progress, and synthesizes outputs', ARRAY['task_dispatch', 'workflow_coordination', 'output_synthesis', 'progress_monitoring']),
('socratic', 'dialogue', 'user_interaction', 'Engages users in clarifying dialogues and helps refine legal questions', ARRAY['dialogue_management', 'question_refinement', 'ambiguity_detection', 'information_extraction']),
('jurisdictional_expert', 'specialist', 'jurisdiction_analysis', 'Specializes in procedural rules and local practice nuances', ARRAY['procedural_analysis', 'local_practice', 'court_customs', 'jurisdictional_research']),
('factual_synthesis', 'analyst', 'fact_extraction', 'Extracts, validates, and correlates facts from various sources', ARRAY['fact_extraction', 'source_validation', 'narrative_construction', 'correlation_analysis']),
('legal_doctrine', 'specialist', 'legal_analysis', 'Deep expertise in specific legal areas and doctrine analysis', ARRAY['doctrine_analysis', 'element_identification', 'defense_analysis', 'remedy_assessment']),
('precedent_search', 'researcher', 'case_law_research', 'Conducts hyper-targeted semantic searches for relevant legal authorities', ARRAY['semantic_search', 'precedent_analysis', 'authority_ranking', 'citation_validation']),
('adversarial', 'critic', 'opposition_analysis', 'Acts as devil''s advocate, simulating opposing counsel arguments', ARRAY['argument_analysis', 'weakness_identification', 'counter_strategy', 'risk_assessment']),
('drafting', 'writer', 'document_generation', 'Generates persuasive, legally precise text with appropriate tone and style', ARRAY['legal_writing', 'tone_adaptation', 'style_matching', 'precision_drafting']),
('compliance', 'validator', 'regulatory_compliance', 'Ensures adherence to ethical guidelines and regulatory requirements', ARRAY['ethics_validation', 'regulatory_compliance', 'policy_adherence', 'risk_mitigation']),
('validation', 'verifier', 'accuracy_verification', 'Cross-verifies citations and quoted passages for accuracy', ARRAY['citation_verification', 'source_validation', 'accuracy_checking', 'quality_assurance']),
('negotiation_strategy', 'strategist', 'deal_analysis', 'Analyzes deal terms and suggests optimal negotiation strategies', ARRAY['deal_analysis', 'market_research', 'strategy_formulation', 'counterparty_analysis'])
ON CONFLICT (agent_name) DO NOTHING;
