import { NextResponse } from "next/server"
import { executeRawQuery } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { enableVectorExtension = true } = (await request.json()) || { enableVectorExtension: true }
    console.log("Starting legal database initialization...")

    // Check if tables already exist
    const existingTables = await executeRawQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('jurisdictions', 'practice_areas', 'document_types', 'legal_documents', 'document_embeddings')
    `)

    if (existingTables.length >= 4) {
      return NextResponse.json({
        success: true,
        message: "Legal database already initialized",
        existing_tables: existingTables.map((t: any) => t.table_name),
      })
    }

    // Enable vector extension for embeddings
    let vectorExtensionEnabled = false
    if (enableVectorExtension) {
      try {
        console.log("Attempting to enable vector extension...")
        await executeRawQuery(`CREATE EXTENSION IF NOT EXISTS vector`)
        vectorExtensionEnabled = true
        console.log("Vector extension enabled successfully")
      } catch (error) {
        console.error("Failed to enable vector extension:", error.message)
        console.log("Continuing without vector extension...")
      }
    }

    // Create the legal database schema
    await executeRawQuery(`
      -- Legal Jurisdictions
      CREATE TABLE IF NOT EXISTS jurisdictions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          code VARCHAR(10) UNIQUE NOT NULL,
          country VARCHAR(100) NOT NULL,
          type VARCHAR(50) NOT NULL,
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
          category VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Legal Documents
      CREATE TABLE IF NOT EXISTS legal_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(500) NOT NULL,
          document_type_id UUID REFERENCES document_types(id),
          jurisdiction_id UUID REFERENCES jurisdictions(id),
          practice_area_id UUID REFERENCES practice_areas(id),
          content TEXT,
          summary TEXT,
          key_terms TEXT[],
          citations TEXT[],
          publication_date DATE,
          status VARCHAR(50) DEFAULT 'active',
          source VARCHAR(255),
          source_url VARCHAR(500),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for legal documents
      CREATE INDEX IF NOT EXISTS idx_legal_documents_jurisdiction ON legal_documents(jurisdiction_id);
      CREATE INDEX IF NOT EXISTS idx_legal_documents_practice_area ON legal_documents(practice_area_id);
      CREATE INDEX IF NOT EXISTS idx_legal_documents_source ON legal_documents(source);
      CREATE INDEX IF NOT EXISTS idx_legal_documents_content_fts ON legal_documents USING gin(to_tsvector('english', content));
    `)

    // Create vector embeddings table if extension is enabled
    if (vectorExtensionEnabled) {
      await executeRawQuery(`
        -- Document Embeddings for Vector Search
        CREATE TABLE IF NOT EXISTS document_embeddings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
            chunk_index INTEGER NOT NULL,
            chunk_text TEXT NOT NULL,
            embedding vector(768), -- Google's embedding model dimension
            section_title VARCHAR(255),
            citations TEXT[],
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create indexes for vector search
        CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id ON document_embeddings(document_id);
        CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        
        -- Legal Cases for enhanced search
        CREATE TABLE IF NOT EXISTS legal_cases (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            case_name VARCHAR(500) NOT NULL,
            case_number VARCHAR(100),
            court VARCHAR(255),
            jurisdiction_id UUID REFERENCES jurisdictions(id),
            decision_date DATE,
            citation VARCHAR(255),
            summary TEXT,
            outcome VARCHAR(100),
            precedential_value VARCHAR(50),
            full_text TEXT,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Research Query Logs
        CREATE TABLE IF NOT EXISTS research_queries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR(255),
            query_text TEXT NOT NULL,
            query_type VARCHAR(50),
            results_count INTEGER,
            execution_time_ms INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)
      console.log("Vector embeddings and related tables created successfully")
    }

    console.log("Tables created, now seeding initial data...")

    // Seed initial data
    await executeRawQuery(`
      -- Insert US Jurisdictions
      INSERT INTO jurisdictions (name, code, country, type) VALUES
      ('United States', 'US', 'United States', 'federal'),
      ('California', 'CA', 'United States', 'state'),
      ('New York', 'NY', 'United States', 'state'),
      ('Texas', 'TX', 'United States', 'state'),
      ('Florida', 'FL', 'United States', 'state'),
      ('Illinois', 'IL', 'United States', 'state'),
      ('Pennsylvania', 'PA', 'United States', 'state'),
      ('Ohio', 'OH', 'United States', 'state'),
      ('Georgia', 'GA', 'United States', 'state'),
      ('North Carolina', 'NC', 'United States', 'state')
      ON CONFLICT (code) DO NOTHING;

      -- Insert Practice Areas
      INSERT INTO practice_areas (name, code, description) VALUES
      ('Constitutional Law', 'CONST', 'Issues relating to constitutional interpretation and rights'),
      ('Criminal Law', 'CRIM', 'Criminal offenses, procedure, and defense'),
      ('Civil Rights', 'CIVIL', 'Civil liberties and discrimination law'),
      ('Contract Law', 'CONTRACT', 'Formation, performance, and breach of contracts'),
      ('Tort Law', 'TORT', 'Personal injury and civil wrongs'),
      ('Corporate Law', 'CORP', 'Business entities, mergers, and corporate governance'),
      ('Employment Law', 'EMPLOY', 'Workplace rights, discrimination, and labor relations'),
      ('Intellectual Property', 'IP', 'Patents, trademarks, copyrights, and trade secrets'),
      ('Real Estate Law', 'REALESTATE', 'Property transactions, zoning, and land use'),
      ('Family Law', 'FAMILY', 'Divorce, custody, adoption, and domestic relations')
      ON CONFLICT (code) DO NOTHING;

      -- Insert Document Types
      INSERT INTO document_types (name, code, description, category) VALUES
      ('Supreme Court Opinion', 'SCOTUS', 'US Supreme Court decisions', 'case_law'),
      ('Federal Court Opinion', 'FED_COURT', 'Federal district and appellate court decisions', 'case_law'),
      ('State Court Opinion', 'STATE_COURT', 'State court decisions', 'case_law'),
      ('Federal Statute', 'FED_STAT', 'Federal laws and statutes', 'statute'),
      ('State Statute', 'STATE_STAT', 'State laws and statutes', 'statute'),
      ('Federal Regulation', 'FED_REG', 'Federal administrative regulations', 'regulation'),
      ('Legal Brief', 'BRIEF', 'Court briefs and memoranda', 'brief'),
      ('Law Review Article', 'LAW_REVIEW', 'Academic legal articles', 'secondary'),
      ('Legal Treatise', 'TREATISE', 'Comprehensive legal texts', 'secondary'),
      ('Practice Guide', 'PRACTICE', 'Practical legal guidance', 'secondary')
      ON CONFLICT (code) DO NOTHING;
    `)

    console.log("Database initialization completed successfully")

    const createdTables = vectorExtensionEnabled
      ? [
          "jurisdictions",
          "practice_areas",
          "document_types",
          "legal_documents",
          "document_embeddings",
          "legal_cases",
          "research_queries",
        ]
      : ["jurisdictions", "practice_areas", "document_types", "legal_documents"]

    return NextResponse.json({
      success: true,
      message: vectorExtensionEnabled
        ? "Legal database with vector embeddings initialized successfully"
        : "Legal database initialized successfully (without vector extension)",
      tables_created: createdTables,
      vector_extension_enabled: vectorExtensionEnabled,
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        suggestion: error.message.includes("vector")
          ? "Vector extension may not be available. Database will work without it."
          : "Check your database connection and permissions.",
      },
      { status: 500 },
    )
  }
}
