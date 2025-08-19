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
          status: string
          updated_at: string
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
          status?: string
          updated_at?: string
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
          status?: string
          updated_at?: string
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
          clinic_address: string | null
          clinic_name: string | null
          created_at: string
          email: string
          experience_years: number | null
          full_name: string
          id: string
          license_number: string | null
          message: string | null
          password: string | null
          phone: string | null
          reviewed_at: string | null
          specialization: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          admin_message?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          created_at?: string
          email: string
          experience_years?: number | null
          full_name: string
          id?: string
          license_number?: string | null
          message?: string | null
          password?: string | null
          phone?: string | null
          reviewed_at?: string | null
          specialization?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          admin_message?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          created_at?: string
          email?: string
          experience_years?: number | null
          full_name?: string
          id?: string
          license_number?: string | null
          message?: string | null
          password?: string | null
          phone?: string | null
          reviewed_at?: string | null
          specialization?: string | null
          status?: string
          updated_at?: string
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
      patients: {
        Row: {
          address: string | null
          clinic_id: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          medical_history: string | null
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          clinic_id: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          medical_history?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          clinic_id?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          medical_history?: string | null
          notes?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
