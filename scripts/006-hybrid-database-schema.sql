-- Create MongoDB connection function
CREATE OR REPLACE FUNCTION mongodb_connect()
RETURNS void AS $$
BEGIN
  PERFORM dblink_connect(
    'mongodb_conn',
    'dbname=legal_platform host=mongodb.example.com user=legal_user password=password'
  );
END;
$$ LANGUAGE plpgsql;

-- Create document versions table for PostgreSQL
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  changes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, version)
);

-- Create vector embeddings table
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(384), -- For storing embeddings directly in PostgreSQL
  section_title TEXT,
  citations TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on embeddings for vector similarity search
CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx ON document_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Add MongoDB document reference to legal_documents
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS mongodb_id TEXT,
ADD COLUMN IF NOT EXISTS content_storage TEXT DEFAULT 'mongodb';

-- Create function to search by vector similarity
CREATE OR REPLACE FUNCTION search_by_vector(query_embedding VECTOR(384), match_threshold FLOAT, match_count INT)
RETURNS TABLE(
  id UUID,
  document_id UUID,
  chunk_text TEXT,
  similarity FLOAT,
  section_title TEXT,
  citations TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.document_id,
    de.chunk_text,
    1 - (de.embedding <=> query_embedding) AS similarity,
    de.section_title,
    de.citations
  FROM
    document_embeddings de
  WHERE
    1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY
    de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get document content from MongoDB
CREATE OR REPLACE FUNCTION get_document_content(doc_id UUID)
RETURNS TEXT AS $$
DECLARE
  content TEXT;
BEGIN
  -- Connect to MongoDB if not already connected
  PERFORM mongodb_connect();
  
  -- Query MongoDB for document content
  SELECT INTO content
    result
  FROM
    dblink('mongodb_conn', 
           format('db.documents_content.findOne({documentId: "%s"}).content', doc_id))
    AS t(result TEXT);
    
  RETURN content;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
