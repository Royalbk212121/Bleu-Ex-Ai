// Supabase database type definitions
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          subscription_tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: string
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
      }
      jurisdictions: {
        Row: {
          id: string
          name: string
          code: string
          country: string
          type: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          country: string
          type: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          country?: string
          type?: string
          parent_id?: string | null
          created_at?: string
        }
      }
      practice_areas: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          parent_id?: string | null
          created_at?: string
        }
      }
      document_types: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          category?: string
          created_at?: string
        }
      }
      legal_cases: {
        Row: {
          id: string
          case_name: string
          case_number: string | null
          court: string
          jurisdiction_id: string | null
          decision_date: string | null
          filing_date: string | null
          case_type: string | null
          status: string | null
          citation: string | null
          docket_number: string | null
          judges: string[] | null
          parties: any | null
          summary: string | null
          outcome: string | null
          precedential_value: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_name: string
          case_number?: string | null
          court: string
          jurisdiction_id?: string | null
          decision_date?: string | null
          filing_date?: string | null
          case_type?: string | null
          status?: string | null
          citation?: string | null
          docket_number?: string | null
          judges?: string[] | null
          parties?: any | null
          summary?: string | null
          outcome?: string | null
          precedential_value?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_name?: string
          case_number?: string | null
          court?: string
          jurisdiction_id?: string | null
          decision_date?: string | null
          filing_date?: string | null
          case_type?: string | null
          status?: string | null
          citation?: string | null
          docket_number?: string | null
          judges?: string[] | null
          parties?: any | null
          summary?: string | null
          outcome?: string | null
          precedential_value?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      legal_documents: {
        Row: {
          id: string
          title: string
          document_type_id: string | null
          case_id: string | null
          jurisdiction_id: string | null
          practice_area_id: string | null
          user_id: string | null
          file_url: string | null
          file_size: number | null
          file_type: string | null
          content: string | null
          summary: string | null
          key_terms: string[] | null
          citations: string[] | null
          publication_date: string | null
          effective_date: string | null
          status: string
          source: string | null
          source_url: string | null
          metadata: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          document_type_id?: string | null
          case_id?: string | null
          jurisdiction_id?: string | null
          practice_area_id?: string | null
          user_id?: string | null
          file_url?: string | null
          file_size?: number | null
          file_type?: string | null
          content?: string | null
          summary?: string | null
          key_terms?: string[] | null
          citations?: string[] | null
          publication_date?: string | null
          effective_date?: string | null
          status?: string
          source?: string | null
          source_url?: string | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          document_type_id?: string | null
          case_id?: string | null
          jurisdiction_id?: string | null
          practice_area_id?: string | null
          user_id?: string | null
          file_url?: string | null
          file_size?: number | null
          file_type?: string | null
          content?: string | null
          summary?: string | null
          key_terms?: string[] | null
          citations?: string[] | null
          publication_date?: string | null
          effective_date?: string | null
          status?: string
          source?: string | null
          source_url?: string | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other table types as needed...
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_sql: {
        Args: {
          query_text: string
          query_params?: any
        }
        Returns: any
      }
      get_table_names: {
        Args: {}
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
