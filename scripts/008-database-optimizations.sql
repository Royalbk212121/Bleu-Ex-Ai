-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_legal_documents_user_id ON legal_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_document_type_id ON legal_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_jurisdiction_id ON legal_documents(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_practice_area_id ON legal_documents(practice_area_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_status ON legal_documents(status);
CREATE INDEX IF NOT EXISTS idx_legal_documents_created_at ON legal_documents(created_at);

-- Create indexes for document embeddings
CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id ON document_embeddings(document_id);

-- Create indexes for legal entities
CREATE INDEX IF NOT EXISTS idx_legal_entities_entity_type ON legal_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_legal_entities_name ON legal_entities(name);

-- Create indexes for legal concepts
CREATE INDEX IF NOT EXISTS idx_legal_concepts_concept_name ON legal_concepts(concept_name);
CREATE INDEX IF NOT EXISTS idx_legal_concepts_concept_type ON legal_concepts(concept_type);

-- Create indexes for legal relationships
CREATE INDEX IF NOT EXISTS idx_legal_relationships_source_id ON legal_relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_legal_relationships_target_id ON legal_relationships(target_id);

-- Create indexes for legal citations
CREATE INDEX IF NOT EXISTS idx_legal_citations_citing_document_id ON legal_citations(citing_document_id);
CREATE INDEX IF NOT EXISTS idx_legal_citations_cited_document_id ON legal_citations(cited_document_id);

-- Create indexes for document content
CREATE INDEX IF NOT EXISTS idx_documents_content_document_id ON documents_content(document_id);

-- Create indexes for document versions
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_version ON document_versions(version);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create indexes for research queries
CREATE INDEX IF NOT EXISTS idx_research_queries_user_id ON research_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_research_queries_query_type ON research_queries(query_type);

-- Create indexes for semantic tags
CREATE INDEX IF NOT EXISTS idx_semantic_tags_tag_name ON semantic_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_semantic_tags_tag_category ON semantic_tags(tag_category);

-- Create indexes for document semantic tags
CREATE INDEX IF NOT EXISTS idx_document_semantic_tags_document_id ON document_semantic_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_semantic_tags_tag_id ON document_semantic_tags(tag_id);

-- Create indexes for document analyses
CREATE INDEX IF NOT EXISTS idx_document_analyses_document_id ON document_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_document_analyses_analysis_type ON document_analyses(analysis_type);

-- Create indexes for legal events
CREATE INDEX IF NOT EXISTS idx_legal_events_event_type ON legal_events(event_type);
CREATE INDEX IF NOT EXISTS idx_legal_events_event_date ON legal_events(event_date);

-- Create indexes for precedent influence
CREATE INDEX IF NOT EXISTS idx_precedent_influence_case_id ON precedent_influence(case_id);
CREATE INDEX IF NOT EXISTS idx_precedent_influence_influenced_case_id ON precedent_influence(influenced_case_id);

-- Create indexes for agent sessions
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_session_type ON agent_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);

-- Create indexes for agent actions
CREATE INDEX IF NOT EXISTS idx_agent_actions_session_id ON agent_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent_id ON agent_actions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_action_type ON agent_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(status);

-- Create indexes for AI models
CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON ai_models(provider);
CREATE INDEX IF NOT EXISTS idx_ai_models_model_type ON ai_models(model_type);

-- Create indexes for AI usage logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model_id ON ai_usage_logs(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_request_type ON ai_usage_logs(request_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);

-- Create function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS void AS $$
BEGIN
  -- Delete AI usage logs older than 90 days
  DELETE FROM ai_usage_logs WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete research queries older than 90 days
  DELETE FROM research_queries WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete agent actions older than 30 days for completed sessions
  DELETE FROM agent_actions 
  WHERE session_id IN (
    SELECT id FROM agent_sessions 
    WHERE status = 'completed' AND updated_at < NOW() - INTERVAL '30 days'
  );
  
  -- Delete completed agent sessions older than 30 days
  DELETE FROM agent_sessions 
  WHERE status = 'completed' AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a function to vacuum the database
CREATE OR REPLACE FUNCTION vacuum_database() RETURNS void AS $$
BEGIN
  VACUUM ANALYZE;
END;
$$ LANGUAGE plpgsql;
