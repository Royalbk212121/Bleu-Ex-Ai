export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      legal_documents: {
        Row: {
          id: string
          title: string
          content: string | null
          summary: string | null
          key_terms: string[] | null
          citations: string[] | null
          document_type_id: string | null
          jurisdiction_id: string | null
          practice_area_id: string | null
          publication_date: string | null
          source: string | null
          source_url: string | null
          status: string | null
          metadata: Json | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          summary?: string | null
          key_terms?: string[] | null
          citations?: string[] | null
          document_type_id?: string | null
          jurisdiction_id?: string | null
          practice_area_id?: string | null
          publication_date?: string | null
          source?: string | null
          source_url?: string | null
          status?: string | null
          metadata?: Json | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          summary?: string | null
          key_terms?: string[] | null
          citations?: string[] | null
          document_type_id?: string | null
          jurisdiction_id?: string | null
          practice_area_id?: string | null
          publication_date?: string | null
          source?: string | null
          source_url?: string | null
          status?: string | null
          metadata?: Json | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      document_types: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          category?: string | null
          created_at?: string
        }
      }
      jurisdictions: {
        Row: {
          id: string
          name: string
          code: string
          country: string | null
          type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          country?: string | null
          type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          country?: string | null
          type?: string | null
          created_at?: string
        }
      }
      practice_areas: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          created_at?: string
        }
      }
      document_embeddings: {
        Row: {
          id: string
          document_id: string
          chunk_index: number
          chunk_text: string
          embedding: Json
          section_title: string | null
          citations: string[] | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          chunk_index: number
          chunk_text: string
          embedding: Json
          section_title?: string | null
          citations?: string[] | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          chunk_index?: number
          chunk_text?: string
          embedding?: Json
          section_title?: string | null
          citations?: string[] | null
          metadata?: Json | null
          created_at?: string
        }
      }
      legal_entities: {
        Row: {
          id: string
          entity_type: string
          name: string
          canonical_id: string | null
          aliases: string[] | null
          description: string | null
          metadata: Json | null
          external_ids: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: string
          name: string
          canonical_id?: string | null
          aliases?: string[] | null
          description?: string | null
          metadata?: Json | null
          external_ids?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: string
          name?: string
          canonical_id?: string | null
          aliases?: string[] | null
          description?: string | null
          metadata?: Json | null
          external_ids?: Json | null
          created_at?: string
        }
      }
      legal_concepts: {
        Row: {
          id: string
          concept_name: string
          concept_type: string
          definition: string
          parent_concept_id: string | null
          related_concepts: string[] | null
          jurisdictions: string[] | null
          practice_areas: string[] | null
          embedding: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          concept_name: string
          concept_type: string
          definition: string
          parent_concept_id?: string | null
          related_concepts?: string[] | null
          jurisdictions?: string[] | null
          practice_areas?: string[] | null
          embedding?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          concept_name?: string
          concept_type?: string
          definition?: string
          parent_concept_id?: string | null
          related_concepts?: string[] | null
          jurisdictions?: string[] | null
          practice_areas?: string[] | null
          embedding?: Json | null
          created_at?: string
        }
      }
      legal_relationships: {
        Row: {
          id: string
          source_type: string
          source_id: string
          relationship_type: string
          target_type: string
          target_id: string
          confidence_score: number | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          source_type: string
          source_id: string
          relationship_type: string
          target_type: string
          target_id: string
          confidence_score?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          source_type?: string
          source_id?: string
          relationship_type?: string
          target_type?: string
          target_id?: string
          confidence_score?: number | null
          metadata?: Json | null
          created_at?: string
        }
      }
      legal_citations: {
        Row: {
          id: string
          citing_document_id: string
          cited_document_id: string | null
          citation_text: string
          citation_type: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          citing_document_id: string
          cited_document_id?: string | null
          citation_text: string
          citation_type: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          citing_document_id?: string
          cited_document_id?: string | null
          citation_text?: string
          citation_type?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      documents_content: {
        Row: {
          id: string
          document_id: string
          content: string
          editor_state: Json | null
          version: number
          created_at: string
          updated_by: string
        }
        Insert: {
          id?: string
          document_id: string
          content: string
          editor_state?: Json | null
          version: number
          created_at?: string
          updated_by: string
        }
        Update: {
          id?: string
          document_id?: string
          content?: string
          editor_state?: Json | null
          version?: number
          created_at?: string
          updated_by?: string
        }
      }
      document_versions: {
        Row: {
          id: string
          document_id: string
          version: number
          content: string
          editor_state: Json | null
          changes: string
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          document_id: string
          version: number
          content: string
          editor_state?: Json | null
          changes: string
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          document_id?: string
          version?: number
          content?: string
          editor_state?: Json | null
          changes?: string
          created_at?: string
          created_by?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: string | null
          subscription_tier: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: string | null
          subscription_tier?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: string | null
          subscription_tier?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      research_queries: {
        Row: {
          id: string
          user_id: string | null
          query_text: string
          query_type: string
          results_count: number
          execution_time_ms: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          query_text: string
          query_type: string
          results_count: number
          execution_time_ms: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          query_text?: string
          query_type?: string
          results_count?: number
          execution_time_ms?: number
          created_at?: string
        }
      }
      semantic_tags: {
        Row: {
          id: string
          tag_name: string
          tag_category: string
          description: string | null
          embedding: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tag_name: string
          tag_category: string
          description?: string | null
          embedding?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          tag_name?: string
          tag_category?: string
          description?: string | null
          embedding?: Json | null
          created_at?: string
        }
      }
      document_semantic_tags: {
        Row: {
          id: string
          document_id: string
          tag_id: string
          confidence_score: number
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          tag_id: string
          confidence_score: number
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          tag_id?: string
          confidence_score?: number
          created_at?: string
        }
      }
      document_analyses: {
        Row: {
          id: string
          document_id: string
          analysis_type: string
          risk_level: string | null
          confidence_score: number
          issues_found: number
          key_findings: Json
          recommendations: Json | null
          ai_model: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          analysis_type: string
          risk_level?: string | null
          confidence_score: number
          issues_found: number
          key_findings: Json
          recommendations?: Json | null
          ai_model?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          analysis_type?: string
          risk_level?: string | null
          confidence_score?: number
          issues_found?: number
          key_findings?: Json
          recommendations?: Json | null
          ai_model?: string | null
          created_at?: string
        }
      }
      legal_events: {
        Row: {
          id: string
          event_type: string
          event_date: string | null
          description: string
          documents: string[] | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          event_date?: string | null
          description: string
          documents?: string[] | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          event_date?: string | null
          description?: string
          documents?: string[] | null
          metadata?: Json | null
          created_at?: string
        }
      }
      precedent_influence: {
        Row: {
          id: string
          case_id: string
          influenced_case_id: string | null
          influence_type: string
          influence_strength: number
          influence_description: string | null
          detected_by: string
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          influenced_case_id?: string | null
          influence_type: string
          influence_strength: number
          influence_description?: string | null
          detected_by: string
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          influenced_case_id?: string | null
          influence_type?: string
          influence_strength?: number
          influence_description?: string | null
          detected_by?: string
          created_at?: string
        }
      }
      agent_sessions: {
        Row: {
          id: string
          user_id: string | null
          session_type: string
          status: string
          task_description: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_type: string
          status: string
          task_description: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_type?: string
          status?: string
          task_description?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      agent_actions: {
        Row: {
          id: string
          session_id: string
          agent_id: string
          action_type: string
          action_input: Json
          action_output: Json | null
          status: string
          error: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          agent_id: string
          action_type: string
          action_input: Json
          action_output?: Json | null
          status: string
          error?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          agent_id?: string
          action_type?: string
          action_input?: Json
          action_output?: Json | null
          status?: string
          error?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      ai_models: {
        Row: {
          id: string
          provider: string
          model_name: string
          model_type: string
          capabilities: string[]
          cost_per_token: number | null
          max_tokens: number | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider: string
          model_name: string
          model_type: string
          capabilities: string[]
          cost_per_token?: number | null
          max_tokens?: number | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider?: string
          model_name?: string
          model_type?: string
          capabilities?: string[]
          cost_per_token?: number | null
          max_tokens?: number | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_usage_logs: {
        Row: {
          id: string
          user_id: string | null
          model_id: string
          request_type: string
          tokens_input: number
          tokens_output: number
          cost: number | null
          latency_ms: number
          success: boolean
          error: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          model_id: string
          request_type: string
          tokens_input: number
          tokens_output: number
          cost?: number | null
          latency_ms: number
          success: boolean
          error?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          model_id?: string
          request_type?: string
          tokens_input?: number
          tokens_output?: number
          cost?: number | null
          latency_ms?: number
          success?: boolean
          error?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_sql: {
        Args: {
          query_text: string
          query_params: Json
        }
        Returns: Json
      }
      match_documents: {
        Args: {
          query_embedding: Json
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          content: string
          similarity: number
        }[]
      }
      match_concepts: {
        Args: {
          query_embedding: Json
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          concept_name: string
          definition: string
          similarity: number
        }[]
      }
      create_documents_content_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_document_versions_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
