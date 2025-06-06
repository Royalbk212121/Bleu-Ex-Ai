-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS execute_sql(TEXT, JSONB);
DROP FUNCTION IF EXISTS execute_sql(JSONB, TEXT);
DROP FUNCTION IF EXISTS cleanup_old_data();
DROP FUNCTION IF EXISTS vacuum_database();

-- Create the execute_sql function with correct parameter order
CREATE OR REPLACE FUNCTION execute_sql(
  query_text TEXT,
  query_params TEXT DEFAULT '[]'
)
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  params_array JSONB;
BEGIN
  -- Parse the JSON parameters
  BEGIN
    params_array := query_params::JSONB;
  EXCEPTION
    WHEN OTHERS THEN
      params_array := '[]'::JSONB;
  END;
  
  -- For now, we'll execute simple queries without parameter substitution
  -- In a production environment, you'd want proper parameter binding
  RETURN QUERY EXECUTE query_text;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL execution error: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql TO service_role;

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TABLE(
  cleaned_ai_logs INTEGER,
  cleaned_research_queries INTEGER,
  cleaned_agent_actions INTEGER,
  cleaned_agent_sessions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ai_logs_count INTEGER := 0;
  research_count INTEGER := 0;
  agent_actions_count INTEGER := 0;
  agent_sessions_count INTEGER := 0;
BEGIN
  -- Delete AI usage logs older than 90 days
  DELETE FROM ai_usage_logs WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS ai_logs_count = ROW_COUNT;
  
  -- Delete research queries older than 90 days  
  DELETE FROM research_queries WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS research_count = ROW_COUNT;
  
  -- Delete agent actions older than 30 days for completed sessions
  DELETE FROM agent_actions 
  WHERE session_id IN (
    SELECT id FROM agent_sessions 
    WHERE status = 'completed' AND updated_at < NOW() - INTERVAL '30 days'
  );
  GET DIAGNOSTICS agent_actions_count = ROW_COUNT;
  
  -- Delete completed agent sessions older than 30 days
  DELETE FROM agent_sessions 
  WHERE status = 'completed' AND updated_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS agent_sessions_count = ROW_COUNT;
  
  -- Return cleanup results
  RETURN QUERY SELECT ai_logs_count, research_count, agent_actions_count, agent_sessions_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_data TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_data TO service_role;

-- Create vacuum function
CREATE OR REPLACE FUNCTION vacuum_database()
RETURNS TABLE(result TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Run VACUUM ANALYZE on main tables
  VACUUM ANALYZE legal_documents;
  VACUUM ANALYZE document_embeddings;
  VACUUM ANALYZE legal_cases;
  VACUUM ANALYZE users;
  VACUUM ANALYZE ai_usage_logs;
  VACUUM ANALYZE research_queries;
  VACUUM ANALYZE agent_sessions;
  VACUUM ANALYZE agent_actions;
  
  RETURN QUERY SELECT 'Database vacuum completed successfully'::TEXT;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION vacuum_database TO authenticated;
GRANT EXECUTE ON FUNCTION vacuum_database TO service_role;

-- Create a simple health check function
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE(
  table_name TEXT,
  row_count BIGINT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_record RECORD;
  count_result BIGINT;
BEGIN
  -- Check main tables
  FOR table_record IN 
    SELECT t.table_name 
    FROM information_schema.tables t 
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN ('legal_documents', 'users', 'legal_cases', 'document_embeddings')
  LOOP
    BEGIN
      EXECUTE format('SELECT COUNT(*) FROM %I', table_record.table_name) INTO count_result;
      RETURN QUERY SELECT table_record.table_name, count_result, 'healthy'::TEXT;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN QUERY SELECT table_record.table_name, 0::BIGINT, 'error'::TEXT;
    END;
  END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION database_health_check TO authenticated;
GRANT EXECUTE ON FUNCTION database_health_check TO service_role;
