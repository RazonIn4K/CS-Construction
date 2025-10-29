export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      change_orders: {
        Row: {
          amount: number
          approved_at: string | null
          co_id: string
          created_at: string | null
          description: string | null
          external_id: string | null
          job_id: string
          status: Database["public"]["Enums"]["change_order_status"] | null
          title: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          co_id?: string
          created_at?: string | null
          description?: string | null
          external_id?: string | null
          job_id: string
          status?: Database["public"]["Enums"]["change_order_status"] | null
          title: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          co_id?: string
          created_at?: string | null
          description?: string | null
          external_id?: string | null
          job_id?: string
          status?: Database["public"]["Enums"]["change_order_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["job_id"]
          },
        ]
      }
      clients: {
        Row: {
          client_id: string
          company: string | null
          created_at: string | null
          email: string
          first_name: string
          last_name: string | null
          phone: string | null
          sms_opt_in: boolean | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string
          company?: string | null
          created_at?: string | null
          email: string
          first_name: string
          last_name?: string | null
          phone?: string | null
          sms_opt_in?: boolean | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          company?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          last_name?: string | null
          phone?: string | null
          sms_opt_in?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      communications: {
        Row: {
          body: string | null
          channel: string | null
          client_id: string | null
          id: string
          job_id: string | null
          sent_at: string | null
          subject: string | null
        }
        Insert: {
          body?: string | null
          channel?: string | null
          client_id?: string | null
          id?: string
          job_id?: string | null
          sent_at?: string | null
          subject?: string | null
        }
        Update: {
          body?: string | null
          channel?: string | null
          client_id?: string | null
          id?: string
          job_id?: string | null
          sent_at?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "communications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_ar"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "communications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["job_id"]
          },
        ]
      }
      estimate_items: {
        Row: {
          description: string | null
          discount_percent: number | null
          estimate_id: string
          item_id: string
          kind: string | null
          name: string
          quantity: number
          sort_order: number | null
          tax_percent: number | null
          unit_price: number
        }
        Insert: {
          description?: string | null
          discount_percent?: number | null
          estimate_id: string
          item_id?: string
          kind?: string | null
          name: string
          quantity?: number
          sort_order?: number | null
          tax_percent?: number | null
          unit_price?: number
        }
        Update: {
          description?: string | null
          discount_percent?: number | null
          estimate_id?: string
          item_id?: string
          kind?: string | null
          name?: string
          quantity?: number
          sort_order?: number | null
          tax_percent?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["estimate_id"]
          },
        ]
      }
      estimates: {
        Row: {
          client_id: string
          created_at: string | null
          currency: string | null
          estimate_id: string
          external_id: string | null
          external_number: string | null
          issue_date: string | null
          job_id: string | null
          notes: string | null
          status: Database["public"]["Enums"]["estimate_status"] | null
          terms: string | null
          valid_until: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          currency?: string | null
          estimate_id?: string
          external_id?: string | null
          external_number?: string | null
          issue_date?: string | null
          job_id?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["estimate_status"] | null
          terms?: string | null
          valid_until?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          currency?: string | null
          estimate_id?: string
          external_id?: string | null
          external_number?: string | null
          issue_date?: string | null
          job_id?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["estimate_status"] | null
          terms?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "estimates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_ar"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "estimates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["job_id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          description: string | null
          discount_percent: number | null
          invoice_id: string
          item_id: string
          kind: string | null
          name: string
          quantity: number
          sort_order: number | null
          tax_percent: number | null
          unit_price: number
        }
        Insert: {
          description?: string | null
          discount_percent?: number | null
          invoice_id: string
          item_id?: string
          kind?: string | null
          name: string
          quantity?: number
          sort_order?: number | null
          tax_percent?: number | null
          unit_price?: number
        }
        Update: {
          description?: string | null
          discount_percent?: number | null
          invoice_id?: string
          item_id?: string
          kind?: string | null
          name?: string
          quantity?: number
          sort_order?: number | null
          tax_percent?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_summary"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      invoices: {
        Row: {
          change_order_id: string | null
          client_id: string
          created_at: string | null
          currency: string | null
          due_date: string | null
          external_id: string | null
          external_number: string | null
          invoice_id: string
          issue_date: string
          job_id: string | null
          memo: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
        }
        Insert: {
          change_order_id?: string | null
          client_id: string
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          external_id?: string | null
          external_number?: string | null
          invoice_id?: string
          issue_date?: string
          job_id?: string | null
          memo?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
        }
        Update: {
          change_order_id?: string | null
          client_id?: string
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          external_id?: string | null
          external_number?: string | null
          invoice_id?: string
          issue_date?: string
          job_id?: string | null
          memo?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_change_order_id_fkey"
            columns: ["change_order_id"]
            isOneToOne: false
            referencedRelation: "change_orders"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_ar"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["job_id"]
          },
        ]
      }
      job_phases: {
        Row: {
          completed_at: string | null
          id: string
          job_id: string
          phase: Database["public"]["Enums"]["job_phase"]
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          job_id: string
          phase: Database["public"]["Enums"]["job_phase"]
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          job_id?: string
          phase?: Database["public"]["Enums"]["job_phase"]
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_phases_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["job_id"]
          },
        ]
      }
      jobs: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          end_date: string | null
          job_id: string
          property_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          job_id?: string
          property_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          job_id?: string
          property_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_ar"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["property_id"]
          },
        ]
      }
      leads: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          channel: string | null
          client_id: string
          created_at: string | null
          intake_notes: string | null
          lead_id: string
          property_id: string
          source: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          channel?: string | null
          client_id: string
          created_at?: string | null
          intake_notes?: string | null
          lead_id?: string
          property_id: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          channel?: string | null
          client_id?: string
          created_at?: string | null
          intake_notes?: string | null
          lead_id?: string
          property_id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_ar"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["property_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          external_id: string | null
          invoice_id: string | null
          method: string | null
          paid_at: string | null
          payment_id: string
          raw_event: Json | null
          status: Database["public"]["Enums"]["payment_status"] | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          external_id?: string | null
          invoice_id?: string | null
          method?: string | null
          paid_at?: string | null
          payment_id?: string
          raw_event?: Json | null
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          external_id?: string | null
          invoice_id?: string | null
          method?: string | null
          paid_at?: string | null
          payment_id?: string
          raw_event?: Json | null
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_summary"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      photos: {
        Row: {
          caption: string | null
          created_at: string | null
          job_id: string
          photo_id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          job_id: string
          photo_id?: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          job_id?: string
          photo_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["job_id"]
          },
        ]
      }
      properties: {
        Row: {
          address1: string
          address2: string | null
          city: string
          client_id: string
          created_at: string | null
          lat: number | null
          lng: number | null
          property_id: string
          state: string
          zip: string
        }
        Insert: {
          address1: string
          address2?: string | null
          city: string
          client_id: string
          created_at?: string | null
          lat?: number | null
          lng?: number | null
          property_id?: string
          state: string
          zip: string
        }
        Update: {
          address1?: string
          address2?: string | null
          city?: string
          client_id?: string
          created_at?: string | null
          lat?: number | null
          lng?: number | null
          property_id?: string
          state?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_ar"
            referencedColumns: ["client_id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string | null
          due_date: string | null
          job_id: string | null
          status: string | null
          task_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          job_id?: string | null
          status?: string | null
          task_id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          job_id?: string | null
          status?: string | null
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["job_id"]
          },
        ]
      }
      webhook_event_dlq: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          event_source: string
          event_type: string
          last_replay_attempt: string | null
          payload: Json
          received_at: string
          replay_count: number
          replayed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_source: string
          event_type: string
          last_replay_attempt?: string | null
          payload: Json
          received_at?: string
          replay_count?: number
          replayed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_source?: string
          event_type?: string
          last_replay_attempt?: string | null
          payload?: Json
          received_at?: string
          replay_count?: number
          replayed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_client_ar: {
        Row: {
          ar_balance: number | null
          client_id: string | null
          first_name: string | null
          last_name: string | null
        }
        Relationships: []
      }
      v_invoice_summary: {
        Row: {
          balance_due: number | null
          client_id: string | null
          invoice_id: string | null
          line_total: number | null
          paid_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_ar"
            referencedColumns: ["client_id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      change_order_status: "draft" | "sent" | "approved" | "declined" | "billed"
      estimate_status: "draft" | "sent" | "approved" | "declined" | "converted"
      invoice_status:
        | "draft"
        | "sent"
        | "viewed"
        | "partial"
        | "paid"
        | "void"
        | "uncollectible"
      job_phase:
        | "intake"
        | "estimate"
        | "contract"
        | "deposit"
        | "construction"
        | "inspection"
        | "final_invoice"
        | "closed"
      job_status:
        | "lead"
        | "pending"
        | "active"
        | "on_hold"
        | "complete"
        | "closed"
      lead_status: "new" | "contacted" | "qualified" | "quoted" | "won" | "lost"
      payment_status: "unapplied" | "applied" | "failed" | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          format: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          format?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      change_order_status: ["draft", "sent", "approved", "declined", "billed"],
      estimate_status: ["draft", "sent", "approved", "declined", "converted"],
      invoice_status: [
        "draft",
        "sent",
        "viewed",
        "partial",
        "paid",
        "void",
        "uncollectible",
      ],
      job_phase: [
        "intake",
        "estimate",
        "contract",
        "deposit",
        "construction",
        "inspection",
        "final_invoice",
        "closed",
      ],
      job_status: [
        "lead",
        "pending",
        "active",
        "on_hold",
        "complete",
        "closed",
      ],
      lead_status: ["new", "contacted", "qualified", "quoted", "won", "lost"],
      payment_status: ["unapplied", "applied", "failed", "refunded"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS"],
    },
  },
} as const

// ==============================================================================
// Backwards-compatible type aliases for direct imports
// ==============================================================================

export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
export type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type LeadUpdate = Database['public']['Tables']['leads']['Update'];

export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];
