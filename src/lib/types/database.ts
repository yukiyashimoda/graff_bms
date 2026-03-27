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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          name_en: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_en?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_en?: string
          sort_order?: number
        }
        Relationships: []
      }
      cocktail_ingredients: {
        Row: {
          cocktail_id: string
          id: string
          product_id: string
          quantity: number
          unit: string
        }
        Insert: {
          cocktail_id: string
          id?: string
          product_id: string
          quantity: number
          unit: string
        }
        Update: {
          cocktail_id?: string
          id?: string
          product_id?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "cocktail_ingredients_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "cocktail_cost_view"
            referencedColumns: ["cocktail_id"]
          },
          {
            foreignKeyName: "cocktail_ingredients_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "cocktails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cocktail_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cocktails: {
        Row: {
          created_at: string
          description: string
          description_en: string
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          name_en: string
          recipe_steps: string[]
          selling_price: number | null
          sort_order: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          description_en?: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          name_en?: string
          recipe_steps?: string[]
          selling_price?: number | null
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          description_en?: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          name_en?: string
          recipe_steps?: string[]
          selling_price?: number | null
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      company_profile: {
        Row: {
          address: string | null
          alert_threshold: number | null
          email: string | null
          id: number
          logo_url: string | null
          name: string | null
          order_text_template: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          alert_threshold?: number | null
          email?: string | null
          id?: number
          logo_url?: string | null
          name?: string | null
          order_text_template?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          alert_threshold?: number | null
          email?: string | null
          id?: number
          logo_url?: string | null
          name?: string | null
          order_text_template?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      glasses: {
        Row: {
          bottle_ml: number | null
          created_at: string
          id: string
          is_available: boolean
          notes: string | null
          opened_at: string
          product_id: string
          selling_price: number | null
          serving_ml: number
          updated_at: string
        }
        Insert: {
          bottle_ml?: number | null
          created_at?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          opened_at?: string
          product_id: string
          selling_price?: number | null
          serving_ml: number
          updated_at?: string
        }
        Update: {
          bottle_ml?: number | null
          created_at?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          opened_at?: string
          product_id?: string
          selling_price?: number | null
          serving_ml?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "glasses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          cost_price: number
          created_at: string
          id: string
          notes: string | null
          product_id: string | null
          quantity_in: number
          quantity_rem: number
          received_at: string
        }
        Insert: {
          cost_price: number
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity_in: number
          quantity_rem: number
          received_at?: string
        }
        Update: {
          cost_price?: number
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity_in?: number
          quantity_rem?: number
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_session_items: {
        Row: {
          actual_quantity: number | null
          id: string
          notes: string | null
          product_id: string | null
          product_name: string
          product_name_en: string
          session_id: string
          system_quantity: number
          unit: string
        }
        Insert: {
          actual_quantity?: number | null
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name: string
          product_name_en?: string
          session_id: string
          system_quantity: number
          unit?: string
        }
        Update: {
          actual_quantity?: number | null
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name?: string
          product_name_en?: string
          session_id?: string
          system_quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_session_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_session_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventory_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_sessions: {
        Row: {
          approved_at: string | null
          id: string
          notes: string | null
          started_at: string
          status: string
          submitted_at: string | null
        }
        Insert: {
          approved_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          submitted_at?: string | null
        }
        Update: {
          approved_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          submitted_at?: string | null
        }
        Relationships: []
      }
      inventory_settings: {
        Row: {
          id: string
          interval_days: number
          next_inventory_date: string | null
          schedule_type: string
          schedule_value: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          interval_days?: number
          next_inventory_date?: string | null
          schedule_type?: string
          schedule_value?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          interval_days?: number
          next_inventory_date?: string | null
          schedule_type?: string
          schedule_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          change_rate: number
          created_at: string
          id: string
          is_read: boolean
          new_price: number
          previous_price: number
          product_id: string | null
        }
        Insert: {
          change_rate: number
          created_at?: string
          id?: string
          is_read?: boolean
          new_price: number
          previous_price: number
          product_id?: string | null
        }
        Update: {
          change_rate?: number
          created_at?: string
          id?: string
          is_read?: boolean
          new_price?: number
          previous_price?: number
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          cost_price: number
          id: string
          product_id: string | null
          recorded_at: string
        }
        Insert: {
          cost_price: number
          id?: string
          product_id?: string | null
          recorded_at?: string
        }
        Update: {
          cost_price?: number
          id?: string
          product_id?: string | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cost_price: number | null
          created_at: string
          custom_tag: string | null
          default_supplier_id: string | null
          display_out_of_stock: boolean
          id: string
          image_url: string | null
          is_available: boolean
          is_recommended: boolean
          name: string
          name_en: string
          notes: string | null
          selling_price: number | null
          supplier_id: string | null
          tags: string[]
          unit: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          custom_tag?: string | null
          default_supplier_id?: string | null
          display_out_of_stock?: boolean
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_recommended?: boolean
          name: string
          name_en?: string
          notes?: string | null
          selling_price?: number | null
          supplier_id?: string | null
          tags?: string[]
          unit?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          custom_tag?: string | null
          default_supplier_id?: string | null
          display_out_of_stock?: boolean
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_recommended?: boolean
          name?: string
          name_en?: string
          notes?: string | null
          selling_price?: number | null
          supplier_id?: string | null
          tags?: string[]
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_default_supplier_id_fkey"
            columns: ["default_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          id: string
          inspection_status: string | null
          notes: string | null
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number
          unit_price: number | null
        }
        Insert: {
          id?: string
          inspection_status?: string | null
          notes?: string | null
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity?: number
          unit_price?: number | null
        }
        Update: {
          id?: string
          inspection_status?: string | null
          notes?: string | null
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      soft_drink_details: {
        Row: {
          created_at: string
          is_mixer: boolean
          product_id: string
          updated_at: string
          volume_ml: number | null
        }
        Insert: {
          created_at?: string
          is_mixer?: boolean
          product_id: string
          updated_at?: string
          volume_ml?: number | null
        }
        Update: {
          created_at?: string
          is_mixer?: boolean
          product_id?: string
          updated_at?: string
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "soft_drink_details_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      spirits_details: {
        Row: {
          age_statement: string | null
          created_at: string
          product_id: string
          shot_price: number | null
          type: string
          updated_at: string
          volume_ml: number | null
        }
        Insert: {
          age_statement?: string | null
          created_at?: string
          product_id: string
          shot_price?: number | null
          type?: string
          updated_at?: string
          volume_ml?: number | null
        }
        Update: {
          age_statement?: string | null
          created_at?: string
          product_id?: string
          shot_price?: number | null
          type?: string
          updated_at?: string
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spirits_details_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          id: string
          min_quantity: number
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          id?: string
          min_quantity?: number
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          id?: string
          min_quantity?: number
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transactions: {
        Row: {
          cost_price: number | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          type: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          type: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          id: string
          name: string
          name_en: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          name: string
          name_en?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          name?: string
          name_en?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wine_details: {
        Row: {
          body: string | null
          country: string
          created_at: string
          description: string
          description_en: string
          grape_varieties: string[]
          product_id: string
          region: string
          region_en: string
          updated_at: string
          vintage: number | null
          wine_type: string
        }
        Insert: {
          body?: string | null
          country?: string
          created_at?: string
          description?: string
          description_en?: string
          grape_varieties?: string[]
          product_id: string
          region?: string
          region_en?: string
          updated_at?: string
          vintage?: number | null
          wine_type?: string
        }
        Update: {
          body?: string | null
          country?: string
          created_at?: string
          description?: string
          description_en?: string
          grape_varieties?: string[]
          product_id?: string
          region?: string
          region_en?: string
          updated_at?: string
          vintage?: number | null
          wine_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wine_details_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cocktail_cost_view: {
        Row: {
          cocktail_id: string | null
          cost_rate_pct: number | null
          name: string | null
          name_en: string | null
          selling_price: number | null
          total_cost: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_inventory_session_adjustments: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      create_orders_from_cart: { Args: { p_cart_items: Json }; Returns: number }
      process_stock_transaction: {
        Args: {
          p_cost_price?: number
          p_notes?: string
          p_product_id: string
          p_quantity: number
          p_type: string
        }
        Returns: number
      }
      receive_purchase_order: {
        Args: { p_order_id: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
