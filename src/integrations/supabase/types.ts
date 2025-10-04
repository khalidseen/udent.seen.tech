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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      advanced_note_templates: {
        Row: {
          category: string
          clinic_id: string
          content_template: string
          created_at: string
          created_by: string
          default_note_type: string | null
          default_priority: string | null
          default_status: string | null
          description: string | null
          field_validations: Json | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          name: string
          optional_fields: string[] | null
          required_fields: string[] | null
          title_template: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          category: string
          clinic_id: string
          content_template: string
          created_at?: string
          created_by: string
          default_note_type?: string | null
          default_priority?: string | null
          default_status?: string | null
          description?: string | null
          field_validations?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name: string
          optional_fields?: string[] | null
          required_fields?: string[] | null
          title_template: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          category?: string
          clinic_id?: string
          content_template?: string
          created_at?: string
          created_by?: string
          default_note_type?: string | null
          default_priority?: string | null
          default_status?: string | null
          description?: string | null
          field_validations?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name?: string
          optional_fields?: string[] | null
          required_fields?: string[] | null
          title_template?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      advanced_tooth_notes: {
        Row: {
          assisting_staff: string[] | null
          attachments: Json | null
          clinic_id: string
          clinical_findings: string | null
          color_code: string | null
          complications: string | null
          content: string
          created_at: string
          created_by: string | null
          diagnosis: string | null
          differential_diagnosis: string[] | null
          examination_date: string | null
          follow_up_date: string | null
          id: string
          is_template: boolean | null
          last_modified_by: string | null
          materials_used: string[] | null
          next_appointment_date: string | null
          note_type: string
          numbering_system: string
          patient_id: string
          patient_response: string | null
          peer_reviewed: boolean | null
          priority: string
          quality_score: number | null
          radiographic_findings: string | null
          reference_links: string[] | null
          related_notes: string[] | null
          review_comments: string | null
          review_date: string | null
          reviewed_by: string | null
          severity: string | null
          status: string
          symptoms: string[] | null
          tags: string[] | null
          template_id: string | null
          title: string
          tooth_number: string
          treating_doctor: string | null
          treatment_completion_date: string | null
          treatment_outcome: string | null
          treatment_performed: string | null
          treatment_plan: string | null
          treatment_start_date: string | null
          updated_at: string
        }
        Insert: {
          assisting_staff?: string[] | null
          attachments?: Json | null
          clinic_id: string
          clinical_findings?: string | null
          color_code?: string | null
          complications?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          differential_diagnosis?: string[] | null
          examination_date?: string | null
          follow_up_date?: string | null
          id?: string
          is_template?: boolean | null
          last_modified_by?: string | null
          materials_used?: string[] | null
          next_appointment_date?: string | null
          note_type?: string
          numbering_system?: string
          patient_id: string
          patient_response?: string | null
          peer_reviewed?: boolean | null
          priority?: string
          quality_score?: number | null
          radiographic_findings?: string | null
          reference_links?: string[] | null
          related_notes?: string[] | null
          review_comments?: string | null
          review_date?: string | null
          reviewed_by?: string | null
          severity?: string | null
          status?: string
          symptoms?: string[] | null
          tags?: string[] | null
          template_id?: string | null
          title: string
          tooth_number: string
          treating_doctor?: string | null
          treatment_completion_date?: string | null
          treatment_outcome?: string | null
          treatment_performed?: string | null
          treatment_plan?: string | null
          treatment_start_date?: string | null
          updated_at?: string
        }
        Update: {
          assisting_staff?: string[] | null
          attachments?: Json | null
          clinic_id?: string
          clinical_findings?: string | null
          color_code?: string | null
          complications?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          differential_diagnosis?: string[] | null
          examination_date?: string | null
          follow_up_date?: string | null
          id?: string
          is_template?: boolean | null
          last_modified_by?: string | null
          materials_used?: string[] | null
          next_appointment_date?: string | null
          note_type?: string
          numbering_system?: string
          patient_id?: string
          patient_response?: string | null
          peer_reviewed?: boolean | null
          priority?: string
          quality_score?: number | null
          radiographic_findings?: string | null
          reference_links?: string[] | null
          related_notes?: string[] | null
          review_comments?: string | null
          review_date?: string | null
          reviewed_by?: string | null
          severity?: string | null
          status?: string
          symptoms?: string[] | null
          tags?: string[] | null
          template_id?: string | null
          title?: string
          tooth_number?: string
          treating_doctor?: string | null
          treatment_completion_date?: string | null
          treatment_outcome?: string | null
          treatment_performed?: string | null
          treatment_plan?: string | null
          treatment_start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_analysis_results: {
        Row: {
          ai_model: string
          analysis_data: Json | null
          analysis_type: string
          clinic_id: string
          confidence_score: number | null
          created_at: string | null
          detected_conditions: Json | null
          id: string
          image_id: string
          recommendations: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_model: string
          analysis_data?: Json | null
          analysis_type: string
          clinic_id: string
          confidence_score?: number | null
          created_at?: string | null
          detected_conditions?: Json | null
          id?: string
          image_id: string
          recommendations?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string
          analysis_data?: Json | null
          analysis_type?: string
          clinic_id?: string
          confidence_score?: number | null
          created_at?: string | null
          detected_conditions?: Json | null
          id?: string
          image_id?: string
          recommendations?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_results_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "medical_images"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_requests: {
        Row: {
          approved_appointment_id: string | null
          clinic_id: string
          condition_description: string
          created_at: string
          id: string
          patient_address: string | null
          patient_email: string | null
          patient_name: string
          patient_phone: string | null
          preferred_date: string
          preferred_time: string
          rejection_reason: string | null
          request_ip: unknown | null
          request_user_agent: string | null
          status: string
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          approved_appointment_id?: string | null
          clinic_id: string
          condition_description: string
          created_at?: string
          id?: string
          patient_address?: string | null
          patient_email?: string | null
          patient_name: string
          patient_phone?: string | null
          preferred_date: string
          preferred_time: string
          rejection_reason?: string | null
          request_ip?: unknown | null
          request_user_agent?: string | null
          status?: string
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          approved_appointment_id?: string | null
          clinic_id?: string
          condition_description?: string
          created_at?: string
          id?: string
          patient_address?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string | null
          preferred_date?: string
          preferred_time?: string
          rejection_reason?: string | null
          request_ip?: unknown | null
          request_user_agent?: string | null
          status?: string
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          clinic_id: string
          created_at: string
          duration: number
          id: string
          notes: string | null
          patient_id: string | null
          status: string
          treatment_type: string | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          clinic_id: string
          created_at?: string
          duration?: number
          id?: string
          notes?: string | null
          patient_id?: string | null
          status?: string
          treatment_type?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          clinic_id?: string
          created_at?: string
          duration?: number
          id?: string
          notes?: string | null
          patient_id?: string | null
          status?: string
          treatment_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          operation: string
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clinic_memberships: {
        Row: {
          clinic_id: string
          id: string
          is_active: boolean
          joined_at: string
          role: Database["public"]["Enums"]["user_role_type"]
          user_id: string
        }
        Insert: {
          clinic_id: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role: Database["public"]["Enums"]["user_role_type"]
          user_id: string
        }
        Update: {
          clinic_id?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_memberships_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_role_hierarchy: {
        Row: {
          can_manage: Database["public"]["Enums"]["user_role_type"][]
          created_at: string | null
          description: string | null
          description_ar: string | null
          id: string
          level: number
          permissions: Json | null
          role_name: Database["public"]["Enums"]["user_role_type"]
        }
        Insert: {
          can_manage?: Database["public"]["Enums"]["user_role_type"][]
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          level: number
          permissions?: Json | null
          role_name: Database["public"]["Enums"]["user_role_type"]
        }
        Update: {
          can_manage?: Database["public"]["Enums"]["user_role_type"][]
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          level?: number
          permissions?: Json | null
          role_name?: Database["public"]["Enums"]["user_role_type"]
        }
        Relationships: []
      }
      clinic_specific_permissions: {
        Row: {
          clinic_id: string
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean
          is_granted: boolean
          permission_category: string
          permission_key: string
          reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean
          is_granted?: boolean
          permission_category: string
          permission_key: string
          reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean
          is_granted?: boolean
          permission_category?: string
          permission_key?: string
          reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clinic_subscription_usage: {
        Row: {
          clinic_id: string
          created_at: string | null
          current_count: number
          id: string
          last_reset_date: string | null
          max_count: number
          metric_type: string
          updated_at: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          current_count?: number
          id?: string
          last_reset_date?: string | null
          max_count: number
          metric_type: string
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          current_count?: number
          id?: string
          last_reset_date?: string | null
          max_count?: number
          metric_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clinical_attachments: {
        Row: {
          category: string | null
          clinic_id: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          note_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          clinic_id: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          note_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string | null
          clinic_id?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          note_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_attachments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "advanced_tooth_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          custom_plan_config: Json | null
          email: string | null
          id: string
          is_active: boolean
          license_number: string | null
          logo_url: string | null
          max_patients: number | null
          max_users: number | null
          name: string
          phone: string | null
          subscription_end_date: string | null
          subscription_notes: string | null
          subscription_plan: string | null
          subscription_plan_id: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          trial_end_date: string | null
          updated_at: string
          usage_metrics: Json | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          custom_plan_config?: Json | null
          email?: string | null
          id?: string
          is_active?: boolean
          license_number?: string | null
          logo_url?: string | null
          max_patients?: number | null
          max_users?: number | null
          name: string
          phone?: string | null
          subscription_end_date?: string | null
          subscription_notes?: string | null
          subscription_plan?: string | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          updated_at?: string
          usage_metrics?: Json | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          custom_plan_config?: Json | null
          email?: string | null
          id?: string
          is_active?: boolean
          license_number?: string | null
          logo_url?: string | null
          max_patients?: number | null
          max_users?: number | null
          name?: string
          phone?: string | null
          subscription_end_date?: string | null
          subscription_notes?: string | null
          subscription_plan?: string | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          updated_at?: string
          usage_metrics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "clinics_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_3d_models: {
        Row: {
          created_at: string
          file_size: number | null
          id: string
          is_active: boolean
          model_name: string
          model_path: string
          model_type: string
          numbering_system: string
          tooth_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          id?: string
          is_active?: boolean
          model_name: string
          model_path: string
          model_type?: string
          numbering_system?: string
          tooth_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          id?: string
          is_active?: boolean
          model_name?: string
          model_path?: string
          model_type?: string
          numbering_system?: string
          tooth_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      dental_treatments: {
        Row: {
          assigned_doctor_id: string | null
          clinic_id: string
          created_at: string
          diagnosis: string
          id: string
          notes: string | null
          numbering_system: string
          patient_id: string
          prescribed_medications: Json | null
          status: string
          tooth_number: string
          tooth_surface: string | null
          treatment_date: string
          treatment_plan: string
          updated_at: string
        }
        Insert: {
          assigned_doctor_id?: string | null
          clinic_id: string
          created_at?: string
          diagnosis: string
          id?: string
          notes?: string | null
          numbering_system?: string
          patient_id: string
          prescribed_medications?: Json | null
          status?: string
          tooth_number: string
          tooth_surface?: string | null
          treatment_date: string
          treatment_plan: string
          updated_at?: string
        }
        Update: {
          assigned_doctor_id?: string | null
          clinic_id?: string
          created_at?: string
          diagnosis?: string
          id?: string
          notes?: string | null
          numbering_system?: string
          patient_id?: string
          prescribed_medications?: Json | null
          status?: string
          tooth_number?: string
          tooth_surface?: string | null
          treatment_date?: string
          treatment_plan?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_treatments_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_treatments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_applications: {
        Row: {
          admin_id: string | null
          admin_message: string | null
          application_hash: string | null
          clinic_address: string | null
          clinic_name: string | null
          created_at: string
          email: string
          experience_years: number | null
          full_name: string
          id: string
          license_number: string | null
          message: string | null
          phone: string | null
          request_ip: unknown | null
          request_user_agent: string | null
          reviewed_at: string | null
          specialization: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          admin_message?: string | null
          application_hash?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          created_at?: string
          email: string
          experience_years?: number | null
          full_name: string
          id?: string
          license_number?: string | null
          message?: string | null
          phone?: string | null
          request_ip?: unknown | null
          request_user_agent?: string | null
          reviewed_at?: string | null
          specialization?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          admin_message?: string | null
          application_hash?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          created_at?: string
          email?: string
          experience_years?: number | null
          full_name?: string
          id?: string
          license_number?: string | null
          message?: string | null
          phone?: string | null
          request_ip?: unknown | null
          request_user_agent?: string | null
          reviewed_at?: string | null
          specialization?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      doctor_assistants: {
        Row: {
          address: string | null
          clinic_id: string
          created_at: string
          email: string | null
          experience_years: number | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          salary: number | null
          specialization: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          clinic_id: string
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          salary?: number | null
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          clinic_id?: string
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          salary?: number | null
          specialization?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_assistants_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          address: string | null
          bio: string | null
          clinic_id: string
          consultation_fee: number | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          experience_years: number | null
          full_name: string
          gender: string | null
          hired_date: string | null
          id: string
          license_number: string | null
          notes: string | null
          phone: string | null
          qualifications: string | null
          specialization: string | null
          status: string
          updated_at: string
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          clinic_id: string
          consultation_fee?: number | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          experience_years?: number | null
          full_name: string
          gender?: string | null
          hired_date?: string | null
          id?: string
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          qualifications?: string | null
          specialization?: string | null
          status?: string
          updated_at?: string
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          clinic_id?: string
          consultation_fee?: number | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          experience_years?: number | null
          full_name?: string
          gender?: string | null
          hired_date?: string | null
          id?: string
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          qualifications?: string | null
          specialization?: string | null
          status?: string
          updated_at?: string
          working_hours?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          service_name: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          line_total: number
          quantity?: number
          service_name: string
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          service_name?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance_due: number
          clinic_id: string
          created_at: string
          discount_amount: number | null
          discount_percentage: number | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_amount: number
          patient_id: string
          status: string
          subtotal: number
          tax_amount: number | null
          tax_percentage: number | null
          total_amount: number
          treatment_plan_id: string | null
          updated_at: string
        }
        Insert: {
          balance_due?: number
          clinic_id: string
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          patient_id: string
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_percentage?: number | null
          total_amount: number
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Update: {
          balance_due?: number
          clinic_id?: string
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          patient_id?: string
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_percentage?: number | null
          total_amount?: number
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      medical_conditions: {
        Row: {
          category: string | null
          clinic_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          severity_level: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          clinic_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          severity_level?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          clinic_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          severity_level?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_conditions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_images: {
        Row: {
          ai_analysis_date: string | null
          ai_analysis_result: Json | null
          ai_analysis_status: string | null
          ai_confidence_score: number | null
          ai_detected_conditions: string[] | null
          annotated_image_path: string | null
          annotation_data: Json | null
          clinic_id: string
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          has_annotations: boolean | null
          id: string
          image_date: string
          image_type: string
          is_after_treatment: boolean | null
          is_before_treatment: boolean | null
          mime_type: string | null
          patient_id: string
          record_id: string | null
          title: string
          tooth_number: string | null
          updated_at: string
        }
        Insert: {
          ai_analysis_date?: string | null
          ai_analysis_result?: Json | null
          ai_analysis_status?: string | null
          ai_confidence_score?: number | null
          ai_detected_conditions?: string[] | null
          annotated_image_path?: string | null
          annotation_data?: Json | null
          clinic_id: string
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          has_annotations?: boolean | null
          id?: string
          image_date?: string
          image_type?: string
          is_after_treatment?: boolean | null
          is_before_treatment?: boolean | null
          mime_type?: string | null
          patient_id: string
          record_id?: string | null
          title: string
          tooth_number?: string | null
          updated_at?: string
        }
        Update: {
          ai_analysis_date?: string | null
          ai_analysis_result?: Json | null
          ai_analysis_status?: string | null
          ai_confidence_score?: number | null
          ai_detected_conditions?: string[] | null
          annotated_image_path?: string | null
          annotation_data?: Json | null
          clinic_id?: string
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          has_annotations?: boolean | null
          id?: string
          image_date?: string
          image_type?: string
          is_after_treatment?: boolean | null
          is_before_treatment?: boolean | null
          mime_type?: string | null
          patient_id?: string
          record_id?: string | null
          title?: string
          tooth_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_images_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          diagnosis: string | null
          id: string
          notes: string | null
          patient_id: string
          record_type: string
          title: string
          treatment_date: string
          treatment_plan: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          diagnosis?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          record_type?: string
          title: string
          treatment_date?: string
          treatment_plan?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          diagnosis?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          record_type?: string
          title?: string
          treatment_date?: string
          treatment_plan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      medical_supplies: {
        Row: {
          batch_number: string | null
          brand: string | null
          category: string
          clinic_id: string
          created_at: string
          current_stock: number
          expiry_date: string | null
          id: string
          is_active: boolean
          minimum_stock: number
          name: string
          notes: string | null
          supplier: string | null
          supplier_contact: string | null
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          brand?: string | null
          category?: string
          clinic_id: string
          created_at?: string
          current_stock?: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          minimum_stock?: number
          name: string
          notes?: string | null
          supplier?: string | null
          supplier_contact?: string | null
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          brand?: string | null
          category?: string
          clinic_id?: string
          created_at?: string
          current_stock?: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          minimum_stock?: number
          name?: string
          notes?: string | null
          supplier?: string | null
          supplier_contact?: string | null
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          clinic_id: string
          created_at: string
          duration: string | null
          form: string
          frequency: string
          generic_name: string | null
          id: string
          instructions: string | null
          is_active: boolean
          prescription_type: string
          strength: string
          trade_name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          duration?: string | null
          form: string
          frequency: string
          generic_name?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          prescription_type?: string
          strength: string
          trade_name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          duration?: string | null
          form?: string
          frequency?: string
          generic_name?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          prescription_type?: string
          strength?: string
          trade_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          advance_days: number
          clinic_id: string
          created_at: string
          default_priority: string
          id: string
          is_active: boolean
          message_template: string
          name: string
          title_template: string
          type: string
          updated_at: string
        }
        Insert: {
          advance_days?: number
          clinic_id: string
          created_at?: string
          default_priority?: string
          id?: string
          is_active?: boolean
          message_template: string
          name: string
          title_template: string
          type: string
          updated_at?: string
        }
        Update: {
          advance_days?: number
          clinic_id?: string
          created_at?: string
          default_priority?: string
          id?: string
          is_active?: boolean
          message_template?: string
          name?: string
          title_template?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          auto_generated: boolean
          clinic_id: string
          created_at: string
          dismissed_at: string | null
          id: string
          max_reminders: number
          message: string
          patient_id: string | null
          priority: string
          related_id: string | null
          related_type: string | null
          reminded_count: number
          scheduled_for: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          auto_generated?: boolean
          clinic_id: string
          created_at?: string
          dismissed_at?: string | null
          id?: string
          max_reminders?: number
          message: string
          patient_id?: string | null
          priority?: string
          related_id?: string | null
          related_type?: string | null
          reminded_count?: number
          scheduled_for: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          auto_generated?: boolean
          clinic_id?: string
          created_at?: string
          dismissed_at?: string | null
          id?: string
          max_reminders?: number
          message?: string
          patient_id?: string | null
          priority?: string
          related_id?: string | null
          related_type?: string | null
          reminded_count?: number
          scheduled_for?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_dental_models: {
        Row: {
          annotations: Json | null
          created_at: string
          created_by: string | null
          id: string
          model_path: string
          modifications: Json | null
          numbering_system: string
          patient_id: string
          tooth_number: string
          updated_at: string
        }
        Insert: {
          annotations?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          model_path: string
          modifications?: Json | null
          numbering_system?: string
          patient_id: string
          tooth_number: string
          updated_at?: string
        }
        Update: {
          annotations?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          model_path?: string
          modifications?: Json | null
          numbering_system?: string
          patient_id?: string
          tooth_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          assigned_doctor_id: string | null
          blood_type: string | null
          clinic_id: string
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
          created_by_role: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          financial_balance: number | null
          financial_status: string | null
          full_name: string
          gender: string | null
          id: string
          insurance_info: string | null
          last_modified_by_id: string | null
          last_modified_by_name: string | null
          last_modified_by_role: string | null
          marital_status: string | null
          medical_condition: string | null
          medical_history: string | null
          national_id: string | null
          notes: string | null
          occupation: string | null
          patient_status: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_doctor_id?: string | null
          blood_type?: string | null
          clinic_id: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          created_by_role?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          financial_balance?: number | null
          financial_status?: string | null
          full_name: string
          gender?: string | null
          id?: string
          insurance_info?: string | null
          last_modified_by_id?: string | null
          last_modified_by_name?: string | null
          last_modified_by_role?: string | null
          marital_status?: string | null
          medical_condition?: string | null
          medical_history?: string | null
          national_id?: string | null
          notes?: string | null
          occupation?: string | null
          patient_status?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_doctor_id?: string | null
          blood_type?: string | null
          clinic_id?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          created_by_role?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          financial_balance?: number | null
          financial_status?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          insurance_info?: string | null
          last_modified_by_id?: string | null
          last_modified_by_name?: string | null
          last_modified_by_role?: string | null
          marital_status?: string | null
          medical_condition?: string | null
          medical_history?: string | null
          national_id?: string | null
          notes?: string | null
          occupation?: string | null
          patient_status?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          clinic_id: string
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          patient_id: string
          payment_date: string
          payment_method: string
          reference_number: string | null
          status: string
          treatment_plan_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          clinic_id: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          patient_id: string
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
          status?: string
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          clinic_id?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          patient_id?: string
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
          status?: string
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          permission_key: string
          permission_name: string
          permission_name_ar: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          permission_key: string
          permission_name: string
          permission_name_ar: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          permission_key?: string
          permission_name?: string
          permission_name_ar?: string
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          created_at: string
          custom_limit: number | null
          feature_key: string
          id: string
          is_enabled: boolean
          plan_id: string
        }
        Insert: {
          created_at?: string
          custom_limit?: number | null
          feature_key: string
          id?: string
          is_enabled?: boolean
          plan_id: string
        }
        Update: {
          created_at?: string
          custom_limit?: number | null
          feature_key?: string
          id?: string
          is_enabled?: boolean
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_permissions: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          permission_key: string
          plan_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          permission_key: string
          plan_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          permission_key?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_permissions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_medications: {
        Row: {
          created_at: string
          dosage: string
          duration: string
          frequency: string
          id: string
          instructions: string | null
          medication_id: string | null
          medication_name: string
          prescription_id: string
        }
        Insert: {
          created_at?: string
          dosage: string
          duration: string
          frequency: string
          id?: string
          instructions?: string | null
          medication_id?: string | null
          medication_name: string
          prescription_id: string
        }
        Update: {
          created_at?: string
          dosage?: string
          duration?: string
          frequency?: string
          id?: string
          instructions?: string | null
          medication_id?: string | null
          medication_name?: string
          prescription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_medications_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          clinic_address: string | null
          clinic_id: string
          clinic_name: string | null
          clinic_phone: string | null
          created_at: string
          diagnosis: string
          doctor_license: string | null
          doctor_name: string
          id: string
          notes: string | null
          patient_id: string
          prescription_date: string
          status: string
          updated_at: string
        }
        Insert: {
          clinic_address?: string | null
          clinic_id: string
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string
          diagnosis: string
          doctor_license?: string | null
          doctor_name: string
          id?: string
          notes?: string | null
          patient_id: string
          prescription_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          clinic_address?: string | null
          clinic_id?: string
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string
          diagnosis?: string
          doctor_license?: string | null
          doctor_name?: string
          id?: string
          notes?: string | null
          patient_id?: string
          prescription_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          clinic_id: string | null
          created_at: string
          current_clinic_role:
            | Database["public"]["Enums"]["user_role_type"]
            | null
          dashboard_link_validation_dismissed: boolean | null
          full_name: string
          id: string
          role: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          current_clinic_role?:
            | Database["public"]["Enums"]["user_role_type"]
            | null
          dashboard_link_validation_dismissed?: boolean | null
          full_name: string
          id?: string
          role?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          current_clinic_role?:
            | Database["public"]["Enums"]["user_role_type"]
            | null
          dashboard_link_validation_dismissed?: boolean | null
          full_name?: string
          id?: string
          role?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          purchase_order_id: string
          quantity: number
          supply_id: string | null
          supply_name: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          purchase_order_id: string
          quantity: number
          supply_id?: string | null
          supply_name: string
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          purchase_order_id?: string
          quantity?: number
          supply_id?: string | null
          supply_name?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "medical_supplies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          clinic_id: string
          created_at: string
          expected_delivery: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          status: string
          supplier: string
          supplier_contact: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          status?: string
          supplier: string
          supplier_contact?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: string
          supplier?: string
          supplier_contact?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      secretaries: {
        Row: {
          clinic_id: string | null
          created_at: string
          email: string
          full_name: string
          id: number
          phone: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: number
          phone?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: number
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secretaries_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          clinic_id: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          title: string
          triggered_by_event_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          clinic_id: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title: string
          triggered_by_event_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          clinic_id?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title?: string
          triggered_by_event_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_triggered_by_event_id_fkey"
            columns: ["triggered_by_event_id"]
            isOneToOne: false
            referencedRelation: "security_events"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          context_data: Json | null
          created_at: string
          details: Json | null
          error_message: string | null
          event_category: Database["public"]["Enums"]["event_category"] | null
          event_type: string
          geolocation: Json | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          operation: string | null
          processed_for_alerts: boolean | null
          record_id: string | null
          risk_score: number | null
          sensitivity_level:
            | Database["public"]["Enums"]["operation_sensitivity"]
            | null
          session_id: string | null
          success: boolean | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context_data?: Json | null
          created_at?: string
          details?: Json | null
          error_message?: string | null
          event_category?: Database["public"]["Enums"]["event_category"] | null
          event_type: string
          geolocation?: Json | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          operation?: string | null
          processed_for_alerts?: boolean | null
          record_id?: string | null
          risk_score?: number | null
          sensitivity_level?:
            | Database["public"]["Enums"]["operation_sensitivity"]
            | null
          session_id?: string | null
          success?: boolean | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context_data?: Json | null
          created_at?: string
          details?: Json | null
          error_message?: string | null
          event_category?: Database["public"]["Enums"]["event_category"] | null
          event_type?: string
          geolocation?: Json | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          operation?: string | null
          processed_for_alerts?: boolean | null
          record_id?: string | null
          risk_score?: number | null
          sensitivity_level?:
            | Database["public"]["Enums"]["operation_sensitivity"]
            | null
          session_id?: string | null
          success?: boolean | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_prices: {
        Row: {
          base_price: number
          clinic_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          service_category: string
          service_name: string
          updated_at: string
        }
        Insert: {
          base_price: number
          clinic_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          service_category?: string
          service_name: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          clinic_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          service_category?: string
          service_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          supply_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          supply_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          supply_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "medical_supplies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_features: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ar: string | null
          feature_key: string
          feature_name: string
          feature_name_ar: string
          id: string
          is_active: boolean
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          feature_key: string
          feature_name: string
          feature_name_ar: string
          id?: string
          is_active?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          feature_key?: string
          feature_name?: string
          feature_name_ar?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      subscription_plan_features: {
        Row: {
          created_at: string | null
          feature_config: Json | null
          feature_key: string
          feature_limit: number | null
          feature_name: string
          feature_name_ar: string
          id: string
          is_enabled: boolean
          plan_id: string
        }
        Insert: {
          created_at?: string | null
          feature_config?: Json | null
          feature_key: string
          feature_limit?: number | null
          feature_name: string
          feature_name_ar: string
          id?: string
          is_enabled?: boolean
          plan_id: string
        }
        Update: {
          created_at?: string | null
          feature_config?: Json | null
          feature_key?: string
          feature_limit?: number | null
          feature_name?: string
          feature_name_ar?: string
          id?: string
          is_enabled?: boolean
          plan_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          description_ar: string | null
          display_order: number
          duration_months: number
          id: string
          is_active: boolean
          is_customizable: boolean
          is_trial: boolean
          max_monthly_appointments: number
          max_patients: number
          max_storage_gb: number
          max_users: number
          name: string
          name_ar: string
          price: number
          trial_duration_days: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number
          duration_months?: number
          id?: string
          is_active?: boolean
          is_customizable?: boolean
          is_trial?: boolean
          max_monthly_appointments?: number
          max_patients?: number
          max_storage_gb?: number
          max_users?: number
          name: string
          name_ar: string
          price?: number
          trial_duration_days?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number
          duration_months?: number
          id?: string
          is_active?: boolean
          is_customizable?: boolean
          is_trial?: boolean
          max_monthly_appointments?: number
          max_patients?: number
          max_storage_gb?: number
          max_users?: number
          name?: string
          name_ar?: string
          price?: number
          trial_duration_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      temporary_permissions: {
        Row: {
          created_at: string | null
          expires_at: string
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          permission_key: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          permission_key: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          permission_key?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tooth_3d_annotations: {
        Row: {
          annotation_type: string
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          numbering_system: string
          patient_id: string
          position_x: number
          position_y: number
          position_z: number
          severity: string | null
          status: string | null
          title: string
          tooth_number: string
          updated_at: string
        }
        Insert: {
          annotation_type: string
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          numbering_system?: string
          patient_id: string
          position_x: number
          position_y: number
          position_z: number
          severity?: string | null
          status?: string | null
          title: string
          tooth_number: string
          updated_at?: string
        }
        Update: {
          annotation_type?: string
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          numbering_system?: string
          patient_id?: string
          position_x?: number
          position_y?: number
          position_z?: number
          severity?: string | null
          status?: string | null
          title?: string
          tooth_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      tooth_conditions: {
        Row: {
          clinic_id: string
          condition_color: string | null
          condition_type: string | null
          created_at: string
          id: string
          notes: string | null
          numbering_system: string
          patient_id: string
          tooth_number: string
          treatment_date: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          condition_color?: string | null
          condition_type?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          numbering_system?: string
          patient_id: string
          tooth_number: string
          treatment_date?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          condition_color?: string | null
          condition_type?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          numbering_system?: string
          patient_id?: string
          tooth_number?: string
          treatment_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tooth_notes: {
        Row: {
          clinic_id: string
          color_code: string | null
          content: string
          created_at: string
          diagnosis: string | null
          examination_date: string
          follow_up_date: string | null
          id: string
          images: Json | null
          note_type: string
          numbering_system: string
          patient_id: string
          priority: string
          status: string
          title: string
          tooth_number: string
          treatment_plan: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          color_code?: string | null
          content: string
          created_at?: string
          diagnosis?: string | null
          examination_date?: string
          follow_up_date?: string | null
          id?: string
          images?: Json | null
          note_type?: string
          numbering_system?: string
          patient_id: string
          priority?: string
          status?: string
          title: string
          tooth_number: string
          treatment_plan?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          color_code?: string | null
          content?: string
          created_at?: string
          diagnosis?: string | null
          examination_date?: string
          follow_up_date?: string | null
          id?: string
          images?: Json | null
          note_type?: string
          numbering_system?: string
          patient_id?: string
          priority?: string
          status?: string
          title?: string
          tooth_number?: string
          treatment_plan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tooth_records: {
        Row: {
          clinic_id: string
          clinical_measurements: Json
          created_at: string
          diagnosis: Json
          id: string
          notes: Json
          patient_id: string
          roots: Json
          surfaces: Json
          tooth_number: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          clinical_measurements?: Json
          created_at?: string
          diagnosis?: Json
          id?: string
          notes?: Json
          patient_id: string
          roots?: Json
          surfaces?: Json
          tooth_number: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          clinical_measurements?: Json
          created_at?: string
          diagnosis?: Json
          id?: string
          notes?: Json
          patient_id?: string
          roots?: Json
          surfaces?: Json
          tooth_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      tooth_treatment_history: {
        Row: {
          anesthesia_used: string[] | null
          appointment_id: string | null
          assisting_doctors: string[] | null
          clinic_id: string
          complications: string | null
          cost: number | null
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          equipment_used: string[] | null
          id: string
          insurance_amount: number | null
          insurance_covered: boolean | null
          materials_used: Json | null
          numbering_system: string
          patient_id: string
          patient_satisfaction: number | null
          primary_doctor: string | null
          related_note_id: string | null
          start_time: string | null
          success_rate: number | null
          tooth_number: string
          treatment_date: string
          treatment_name: string
          treatment_type: string
        }
        Insert: {
          anesthesia_used?: string[] | null
          appointment_id?: string | null
          assisting_doctors?: string[] | null
          clinic_id: string
          complications?: string | null
          cost?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          equipment_used?: string[] | null
          id?: string
          insurance_amount?: number | null
          insurance_covered?: boolean | null
          materials_used?: Json | null
          numbering_system?: string
          patient_id: string
          patient_satisfaction?: number | null
          primary_doctor?: string | null
          related_note_id?: string | null
          start_time?: string | null
          success_rate?: number | null
          tooth_number: string
          treatment_date: string
          treatment_name: string
          treatment_type: string
        }
        Update: {
          anesthesia_used?: string[] | null
          appointment_id?: string | null
          assisting_doctors?: string[] | null
          clinic_id?: string
          complications?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          equipment_used?: string[] | null
          id?: string
          insurance_amount?: number | null
          insurance_covered?: boolean | null
          materials_used?: Json | null
          numbering_system?: string
          patient_id?: string
          patient_satisfaction?: number | null
          primary_doctor?: string | null
          related_note_id?: string | null
          start_time?: string | null
          success_rate?: number | null
          tooth_number?: string
          treatment_date?: string
          treatment_name?: string
          treatment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tooth_treatment_history_related_note_id_fkey"
            columns: ["related_note_id"]
            isOneToOne: false
            referencedRelation: "advanced_tooth_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          end_date: string | null
          estimated_cost: number
          id: string
          notes: string | null
          patient_id: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimated_cost?: number
          id?: string
          notes?: string | null
          patient_id: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimated_cost?: number
          id?: string
          notes?: string | null
          patient_id?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          clinic_id: string
          current_count: number
          id: string
          last_updated: string
          max_count: number
          metric_type: string
        }
        Insert: {
          clinic_id: string
          current_count?: number
          id?: string
          last_updated?: string
          max_count?: number
          metric_type: string
        }
        Update: {
          clinic_id?: string
          current_count?: number
          id?: string
          last_updated?: string
          max_count?: number
          metric_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system_role: boolean
          role_name: string
          role_name_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_role?: boolean
          role_name: string
          role_name_ar: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_role?: boolean
          role_name?: string
          role_name_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_patient_financial_status: {
        Args: { patient_id_param: string }
        Returns: {
          balance_due: number
          status: string
          total_charges: number
          total_payments: number
        }[]
      }
      can_manage_role: {
        Args: {
          manager_role: Database["public"]["Enums"]["user_role_type"]
          target_role: Database["public"]["Enums"]["user_role_type"]
        }
        Returns: boolean
      }
      check_appointment_request_rate_limit: {
        Args: { ip_address: unknown }
        Returns: boolean
      }
      check_doctor_application_rate_limit: {
        Args: { ip_address: unknown }
        Returns: boolean
      }
      check_usage_limit: {
        Args: { clinic_id_param?: string; metric_type_param: string }
        Returns: boolean
      }
      create_clinic_with_owner: {
        Args: {
          address?: string
          city?: string
          clinic_name: string
          email?: string
          license_number?: string
          max_patients?: number
          max_users?: number
          phone?: string
          subscription_plan_name?: string
        }
        Returns: Json
      }
      detect_suspicious_activities: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enhanced_rate_limit_check: {
        Args: {
          ip_address: unknown
          max_requests?: number
          table_name: string
          time_window?: unknown
        }
        Returns: boolean
      }
      generate_automatic_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_invoice_number: {
        Args: { clinic_id_param: string }
        Returns: string
      }
      generate_purchase_order_number: {
        Args: { clinic_id_param: string }
        Returns: string
      }
      get_audit_statistics: {
        Args: { days_back?: number }
        Returns: Json
      }
      get_clinic_stats_batch: {
        Args: Record<PropertyKey, never>
        Returns: {
          appointment_count: number
          clinic_id: string
          clinic_name: string
          patient_count: number
          user_count: number
        }[]
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          clinic_id: string | null
          created_at: string
          current_clinic_role:
            | Database["public"]["Enums"]["user_role_type"]
            | null
          dashboard_link_validation_dismissed: boolean | null
          full_name: string
          id: string
          role: string
          status: string | null
          updated_at: string
          user_id: string
        }
      }
      get_dashboard_dismissed: {
        Args: { p_profile_id: string }
        Returns: boolean
      }
      get_user_accessible_clinics: {
        Args: Record<PropertyKey, never>
        Returns: {
          access_type: string
          clinic_id: string
          clinic_name: string
          is_current: boolean
        }[]
      }
      get_user_clinic_role: {
        Args: { user_id_param?: string }
        Returns: Database["public"]["Enums"]["user_role_type"]
      }
      get_user_current_clinic: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_effective_permissions: {
        Args: { user_id_param?: string }
        Returns: {
          category: string
          permission_key: string
          permission_name: string
          permission_name_ar: string
          source: string
        }[]
      }
      get_user_permissions: {
        Args: { user_id_param?: string }
        Returns: {
          category: string
          permission_key: string
          permission_name: string
          permission_name_ar: string
        }[]
      }
      get_user_roles: {
        Args: { user_id_param?: string }
        Returns: {
          is_primary: boolean
          role_name: string
          role_name_ar: string
        }[]
      }
      has_clinic_permission: {
        Args: { permission_key: string; user_id_param?: string }
        Returns: boolean
      }
      has_permission: {
        Args: { permission_key_param: string; user_id_param?: string }
        Returns: boolean
      }
      has_plan_feature: {
        Args: { clinic_id_param?: string; feature_key_param: string }
        Returns: boolean
      }
      has_plan_permission: {
        Args: { permission_key_param: string; user_id_param?: string }
        Returns: boolean
      }
      has_temporary_permission: {
        Args: { permission_key_param: string; user_id_param: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_security_event: {
        Args: { details: Json; event_type: string }
        Returns: undefined
      }
      set_dashboard_dismissed: {
        Args: { p_profile_id: string; p_value: boolean }
        Returns: undefined
      }
      switch_user_clinic: {
        Args: { new_clinic_id: string }
        Returns: boolean
      }
      update_usage_metric: {
        Args: {
          clinic_id_param: string
          metric_type_param: string
          new_count: number
        }
        Returns: undefined
      }
    }
    Enums: {
      event_category:
        | "authentication"
        | "data_access"
        | "data_modification"
        | "permission_change"
        | "system_admin"
        | "financial"
        | "medical_record"
      operation_sensitivity: "normal" | "sensitive" | "critical"
      user_role_type:
        | "super_admin"
        | "clinic_manager"
        | "dentist"
        | "assistant"
        | "accountant"
        | "owner"
        | "receptionist"
        | "secretary"
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
      event_category: [
        "authentication",
        "data_access",
        "data_modification",
        "permission_change",
        "system_admin",
        "financial",
        "medical_record",
      ],
      operation_sensitivity: ["normal", "sensitive", "critical"],
      user_role_type: [
        "super_admin",
        "clinic_manager",
        "dentist",
        "assistant",
        "accountant",
        "owner",
        "receptionist",
        "secretary",
      ],
    },
  },
} as const
