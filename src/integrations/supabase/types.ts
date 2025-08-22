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
      dental_treatments: {
        Row: {
          clinic_id: string
          created_at: string
          diagnosis: string
          id: string
          notes: string | null
          numbering_system: string
          patient_id: string
          status: string
          tooth_number: string
          tooth_surface: string | null
          treatment_date: string
          treatment_plan: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          diagnosis: string
          id?: string
          notes?: string | null
          numbering_system?: string
          patient_id: string
          status?: string
          tooth_number: string
          tooth_surface?: string | null
          treatment_date: string
          treatment_plan: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          diagnosis?: string
          id?: string
          notes?: string | null
          numbering_system?: string
          patient_id?: string
          status?: string
          tooth_number?: string
          tooth_surface?: string | null
          treatment_date?: string
          treatment_plan?: string
          updated_at?: string
        }
        Relationships: [
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
          updated_at?: string
        }
        Relationships: []
      }
      medical_images: {
        Row: {
          ai_analysis_date: string | null
          ai_analysis_result: Json | null
          ai_analysis_status: string | null
          ai_confidence_score: number | null
          ai_detected_conditions: string[] | null
          clinic_id: string
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
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
          clinic_id: string
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
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
          clinic_id?: string
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
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
      patients: {
        Row: {
          address: string | null
          blood_type: string | null
          clinic_id: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          gender: string | null
          id: string
          insurance_info: string | null
          marital_status: string | null
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
          blood_type?: string | null
          clinic_id: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          gender?: string | null
          id?: string
          insurance_info?: string | null
          marital_status?: string | null
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
          blood_type?: string | null
          clinic_id?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          insurance_info?: string | null
          marital_status?: string | null
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
          invoice_id: string
          notes: string | null
          patient_id: string
          payment_date: string
          payment_method: string
          reference_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          clinic_id: string
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          patient_id: string
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          clinic_id?: string
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          patient_id?: string
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
          status?: string
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
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          role?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_appointment_request_rate_limit: {
        Args: { ip_address: unknown }
        Returns: boolean
      }
      check_doctor_application_rate_limit: {
        Args: { ip_address: unknown }
        Returns: boolean
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
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          full_name: string
          id: string
          role: string
          status: string | null
          updated_at: string
          user_id: string
        }
      }
      log_security_event: {
        Args: { details: Json; event_type: string }
        Returns: undefined
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
    Enums: {},
  },
} as const
