-- LexEthos™ Security, Ethics & Compliance Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Security Policies Table
CREATE TABLE IF NOT EXISTS security_policies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    rules JSONB NOT NULL DEFAULT '[]',
    compliance_frameworks TEXT[] DEFAULT '{}',
    enforcement_level TEXT CHECK (enforcement_level IN ('advisory', 'warning', 'blocking')) DEFAULT 'warning',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT,
    session_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    compliance_flags TEXT[] DEFAULT '{}',
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Audit Logs Table
CREATE TABLE IF NOT EXISTS ai_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id TEXT NOT NULL,
    prompt_hash TEXT NOT NULL,
    response_hash TEXT NOT NULL,
    reasoning TEXT,
    confidence_score DECIMAL(3,2),
    source_count INTEGER DEFAULT 0,
    user_id TEXT,
    session_id TEXT NOT NULL,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bias Assessments Table
CREATE TABLE IF NOT EXISTS bias_assessments (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL,
    assessment_type TEXT CHECK (assessment_type IN ('demographic', 'geographic', 'linguistic', 'legal_domain')) NOT NULL,
    bias_score INTEGER CHECK (bias_score >= 0 AND bias_score <= 100),
    detected_biases JSONB DEFAULT '[]',
    mitigation_actions TEXT[] DEFAULT '{}',
    assessment_date TIMESTAMPTZ NOT NULL,
    next_assessment_due TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance Reports Table
CREATE TABLE IF NOT EXISTS compliance_reports (
    id TEXT PRIMARY KEY,
    framework TEXT NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('compliant', 'non_compliant', 'partial', 'under_review')) NOT NULL,
    violations JSONB DEFAULT '[]',
    recommendations TEXT[] DEFAULT '{}',
    generated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Encryption Keys Table
CREATE TABLE IF NOT EXISTS encryption_keys (
    id TEXT PRIMARY KEY,
    key_hash TEXT NOT NULL UNIQUE,
    algorithm TEXT NOT NULL,
    key_size INTEGER NOT NULL,
    user_controlled BOOLEAN DEFAULT false,
    user_id TEXT,
    organization_id TEXT,
    data_classification TEXT CHECK (data_classification IN ('public', 'internal', 'confidential', 'restricted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- Data Residency Configs Table
CREATE TABLE IF NOT EXISTS data_residency_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NOT NULL,
    region TEXT NOT NULL,
    country TEXT NOT NULL,
    jurisdiction TEXT NOT NULL,
    compliance_requirements TEXT[] DEFAULT '{}',
    allowed_regions TEXT[] DEFAULT '{}',
    restricted_regions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system_role BOOLEAN DEFAULT false,
    organization_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- HITL Tasks Table
CREATE TABLE IF NOT EXISTS hitl_tasks (
    id TEXT PRIMARY KEY,
    task_type TEXT CHECK (task_type IN ('validation', 'correction', 'review', 'approval')) NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    content TEXT NOT NULL,
    confidence_score JSONB,
    flagged_issues JSONB DEFAULT '[]',
    assigned_to TEXT,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'escalated')) DEFAULT 'pending',
    deadline TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- VeritasShield Validations Table
CREATE TABLE IF NOT EXISTS veritas_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_hash TEXT NOT NULL,
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    validation_result JSONB NOT NULL,
    blockchain_hash TEXT,
    requires_human_review BOOLEAN DEFAULT false,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zero Training Policy Logs Table
CREATE TABLE IF NOT EXISTS zero_training_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_hash TEXT NOT NULL,
    data_type TEXT,
    source TEXT,
    user_id TEXT,
    blocked BOOLEAN NOT NULL,
    reason TEXT,
    audit_trail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON audit_logs(risk_level);

CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_model_id ON ai_audit_logs(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_user_id ON ai_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_created_at ON ai_audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

CREATE INDEX IF NOT EXISTS idx_hitl_tasks_status ON hitl_tasks(status);
CREATE INDEX IF NOT EXISTS idx_hitl_tasks_priority ON hitl_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_hitl_tasks_assigned_to ON hitl_tasks(assigned_to);

CREATE INDEX IF NOT EXISTS idx_veritas_validations_content_hash ON veritas_validations(content_hash);
CREATE INDEX IF NOT EXISTS idx_veritas_validations_confidence ON veritas_validations(confidence_score);

-- Create functions for automated tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_security_policies_updated_at BEFORE UPDATE ON security_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_residency_configs_updated_at BEFORE UPDATE ON data_residency_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hitl_tasks_updated_at BEFORE UPDATE ON hitl_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default security policies
INSERT INTO security_policies (id, name, description, rules, compliance_frameworks, enforcement_level) VALUES
('default_encryption', 'Default Encryption Policy', 'Encrypt all sensitive data', 
 '[{"type": "encryption", "condition": "data.sensitive = true", "action": "encrypt_aes256"}]', 
 '{"GDPR", "CCPA"}', 'blocking'),
('audit_all', 'Comprehensive Audit Policy', 'Log all user actions', 
 '[{"type": "audit", "condition": "action.type != system", "action": "log_detailed"}]', 
 '{"SOX", "GDPR"}', 'warning'),
('zero_training', 'Zero Training Policy', 'Prohibit client data in training', 
 '[{"type": "training_prohibition", "condition": "data.source = client", "action": "block_training"}]', 
 '{"Privacy"}', 'blocking')
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_tasks ENABLE ROW LEVEL SECURITY;

-- Audit logs can be read by admins and the user who created them
CREATE POLICY audit_logs_policy ON audit_logs
    FOR SELECT
    USING (
        user_id = current_setting('app.current_user_id', true)::text
        OR EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = current_setting('app.current_user_id', true)::text 
            AND r.name IN ('Super Administrator', 'Firm Administrator')
            AND ur.is_active = true
        )
    );

-- AI audit logs can be read by the user and admins
CREATE POLICY ai_audit_logs_policy ON ai_audit_logs
    FOR SELECT
    USING (
        user_id = current_setting('app.current_user_id', true)::text
        OR EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = current_setting('app.current_user_id', true)::text 
            AND r.name IN ('Super Administrator', 'Firm Administrator')
            AND ur.is_active = true
        )
    );

-- User roles can be read by the user themselves and admins
CREATE POLICY user_roles_policy ON user_roles
    FOR SELECT
    USING (
        user_id = current_setting('app.current_user_id', true)::text
        OR EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = current_setting('app.current_user_id', true)::text 
            AND r.name IN ('Super Administrator', 'Firm Administrator')
            AND ur.is_active = true
        )
    );

-- HITL tasks can be read by assigned users and admins
CREATE POLICY hitl_tasks_policy ON hitl_tasks
    FOR SELECT
    USING (
        assigned_to = current_setting('app.current_user_id', true)::text
        OR EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = current_setting('app.current_user_id', true)::text 
            AND r.name IN ('Super Administrator', 'Firm Administrator')
            AND ur.is_active = true
        )
    );
