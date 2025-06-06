-- Create document storage tables and functions

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create documents_content table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  editor_state JSONB,
  version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT NOT NULL
);

-- Create document_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  editor_state JSONB,
  changes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL
);

-- Create index on document_id and version for faster lookups
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_version ON document_versions(version);

-- Create helper functions for table creation
CREATE OR REPLACE FUNCTION create_documents_content_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'documents_content') THEN
    CREATE TABLE documents_content (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      document_id TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      editor_state JSONB,
      version INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_by TEXT NOT NULL
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_document_versions_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'document_versions') THEN
    CREATE TABLE document_versions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      document_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      editor_state JSONB,
      changes TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by TEXT NOT NULL
    );
    
    CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
    CREATE INDEX idx_document_versions_version ON document_versions(version);
  END IF;
END;
$$ LANGUAGE plpgsql;
