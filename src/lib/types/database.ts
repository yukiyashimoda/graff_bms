export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row:           { id: string; name: string; name_en: string; sort_order: number; created_at: string }
        Insert:        { id?: string; name: string; name_en?: string; sort_order?: number; created_at?: string }
        Update:        Partial<Database['public']['Tables']['categories']['Insert']>
        Relationships: []
      }
      suppliers: {
        Row:           { id: string; name: string; name_en: string; contact_name: string | null; phone: string | null; address: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert:        { id?: string; name: string; name_en?: string; contact_name?: string | null; phone?: string | null; address?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
        Update:        Partial<Database['public']['Tables']['suppliers']['Insert']>
        Relationships: []
      }
      products: {
        Row:           { id: string; category_id: string | null; supplier_id: string | null; name: string; name_en: string; unit: string; cost_price: number | null; selling_price: number | null; image_url: string | null; tags: string[]; is_available: boolean; notes: string | null; created_at: string; updated_at: string; is_recommended: boolean; custom_tag: string | null; display_out_of_stock: boolean; default_supplier_id: string | null }
        Insert:        { id?: string; category_id?: string | null; supplier_id?: string | null; name: string; name_en?: string; unit?: string; cost_price?: number | null; selling_price?: number | null; image_url?: string | null; tags?: string[]; is_available?: boolean; notes?: string | null; created_at?: string; updated_at?: string; is_recommended?: boolean; custom_tag?: string | null; display_out_of_stock?: boolean; default_supplier_id?: string | null }
        Update:        Partial<Database['public']['Tables']['products']['Insert']>
        Relationships: []
      }
      wine_details: {
        Row:           { product_id: string; country: string; region: string; region_en: string; grape_varieties: string[]; body: 'light' | 'medium' | 'full' | null; vintage: number | null; description: string; description_en: string; wine_type: 'white' | 'red' | 'rosé' | 'sparkling' | 'champagne' | 'other'; created_at: string; updated_at: string }
        Insert:        { product_id: string; country?: string; region?: string; region_en?: string; grape_varieties?: string[]; body?: 'light' | 'medium' | 'full' | null; vintage?: number | null; description?: string; description_en?: string; wine_type?: 'white' | 'red' | 'rosé' | 'sparkling' | 'champagne' | 'other'; created_at?: string; updated_at?: string }
        Update:        Partial<Database['public']['Tables']['wine_details']['Insert']>
        Relationships: [{ foreignKeyName: 'wine_details_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id'] }]
      }
      spirits_details: {
        Row:           { product_id: string; type: string; volume_ml: number | null; shot_price: number | null; age_statement: string | null; created_at: string; updated_at: string }
        Insert:        { product_id: string; type?: string; volume_ml?: number | null; shot_price?: number | null; age_statement?: string | null; created_at?: string; updated_at?: string }
        Update:        Partial<Database['public']['Tables']['spirits_details']['Insert']>
        Relationships: [{ foreignKeyName: 'spirits_details_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id'] }]
      }
      soft_drink_details: {
        Row:           { product_id: string; volume_ml: number | null; is_mixer: boolean; created_at: string; updated_at: string }
        Insert:        { product_id: string; volume_ml?: number | null; is_mixer?: boolean; created_at?: string; updated_at?: string }
        Update:        Partial<Database['public']['Tables']['soft_drink_details']['Insert']>
        Relationships: [{ foreignKeyName: 'soft_drink_details_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id'] }]
      }
      stock: {
        Row:           { id: string; product_id: string; quantity: number; min_quantity: number; updated_at: string }
        Insert:        { id?: string; product_id: string; quantity?: number; min_quantity?: number; updated_at?: string }
        Update:        Partial<Database['public']['Tables']['stock']['Insert']>
        Relationships: []
      }
      stock_transactions: {
        Row:           { id: string; product_id: string; type: 'in' | 'out' | 'adjustment'; quantity: number; cost_price: number | null; notes: string | null; created_at: string; created_by: string | null }
        Insert:        { id?: string; product_id: string; type: 'in' | 'out' | 'adjustment'; quantity: number; cost_price?: number | null; notes?: string | null; created_at?: string; created_by?: string | null }
        Update:        Partial<Database['public']['Tables']['stock_transactions']['Insert']>
        Relationships: []
      }
      price_history: {
        Row:           { id: string; product_id: string; cost_price: number; recorded_at: string }
        Insert:        { id?: string; product_id: string; cost_price: number; recorded_at?: string }
        Update:        Partial<Database['public']['Tables']['price_history']['Insert']>
        Relationships: []
      }
      price_alerts: {
        Row:           { id: string; product_id: string; previous_price: number; new_price: number; change_rate: number; is_read: boolean; created_at: string }
        Insert:        { id?: string; product_id: string; previous_price: number; new_price: number; change_rate: number; is_read?: boolean; created_at?: string }
        Update:        Partial<Database['public']['Tables']['price_alerts']['Insert']>
        Relationships: []
      }
      cocktails: {
        Row:           { id: string; name: string; name_en: string; description: string; description_en: string; selling_price: number | null; image_url: string | null; tags: string[]; is_available: boolean; sort_order: number; created_at: string; updated_at: string }
        Insert:        { id?: string; name: string; name_en?: string; description?: string; description_en?: string; selling_price?: number | null; image_url?: string | null; tags?: string[]; is_available?: boolean; sort_order?: number; created_at?: string; updated_at?: string }
        Update:        Partial<Database['public']['Tables']['cocktails']['Insert']>
        Relationships: []
      }
      cocktail_ingredients: {
        Row:           { id: string; cocktail_id: string; product_id: string; quantity: number; unit: string }
        Insert:        { id?: string; cocktail_id: string; product_id: string; quantity: number; unit: string }
        Update:        Partial<Database['public']['Tables']['cocktail_ingredients']['Insert']>
        Relationships: []
      }
      purchase_orders: {
        Row:           { id: string; supplier_id: string; status: 'draft' | 'sent' | 'received' | 'cancelled'; order_date: string; expected_date: string | null; notes: string | null; created_at: string; updated_at: string; created_by: string | null }
        Insert:        { id?: string; supplier_id: string; status?: 'draft' | 'sent' | 'received' | 'cancelled'; order_date?: string; expected_date?: string | null; notes?: string | null; created_at?: string; updated_at?: string; created_by?: string | null }
        Update:        Partial<Database['public']['Tables']['purchase_orders']['Insert']>
        Relationships: []
      }
      purchase_order_items: {
        Row:           { id: string; purchase_order_id: string; product_id: string; quantity: number; unit_price: number | null; notes: string | null }
        Insert:        { id?: string; purchase_order_id: string; product_id: string; quantity: number; unit_price?: number | null; notes?: string | null }
        Update:        Partial<Database['public']['Tables']['purchase_order_items']['Insert']>
        Relationships: []
      }
      inventory_settings: {
        Row:           { id: string; interval_days: number; updated_at: string }
        Insert:        { id?: string; interval_days: number; updated_at?: string }
        Update:        Partial<Database['public']['Tables']['inventory_settings']['Insert']>
        Relationships: []
      }
      inventory_sessions: {
        Row:           { id: string; status: 'in_progress' | 'submitted' | 'approved'; started_at: string; submitted_at: string | null; approved_at: string | null; notes: string | null }
        Insert:        { id?: string; status?: 'in_progress' | 'submitted' | 'approved'; started_at?: string; submitted_at?: string | null; approved_at?: string | null; notes?: string | null }
        Update:        Partial<Database['public']['Tables']['inventory_sessions']['Insert']>
        Relationships: []
      }
      inventory_session_items: {
        Row:           { id: string; session_id: string; product_id: string; product_name: string; product_name_en: string; unit: string; system_quantity: number; actual_quantity: number | null; notes: string | null }
        Insert:        { id?: string; session_id: string; product_id: string; product_name: string; product_name_en?: string; unit?: string; system_quantity: number; actual_quantity?: number | null; notes?: string | null }
        Update:        Partial<Database['public']['Tables']['inventory_session_items']['Insert']>
        Relationships: []
      }
    }
    Views: {
      cocktail_cost_view: {
        Row: { cocktail_id: string; name: string; name_en: string; selling_price: number | null; total_cost: number; cost_rate_pct: number | null }
        Relationships: []
      }
    }
    Functions:      {}
    Enums:          {}
    CompositeTypes: {}
  }
}

// 便利な型エイリアス
export type Category          = Database['public']['Tables']['categories']['Row']
export type Supplier          = Database['public']['Tables']['suppliers']['Row']
export type Product           = Database['public']['Tables']['products']['Row']
export type Stock             = Database['public']['Tables']['stock']['Row']
export type StockTransaction  = Database['public']['Tables']['stock_transactions']['Row']
export type PriceAlert        = Database['public']['Tables']['price_alerts']['Row']
export type Cocktail          = Database['public']['Tables']['cocktails']['Row']
export type CocktailIngredient = Database['public']['Tables']['cocktail_ingredients']['Row']
export type PurchaseOrder     = Database['public']['Tables']['purchase_orders']['Row']
export type PurchaseOrderItem = Database['public']['Tables']['purchase_order_items']['Row']
export type CocktailCostView  = Database['public']['Views']['cocktail_cost_view']['Row']

// 詳細テーブル型エイリアス
export type WineDetails       = Database['public']['Tables']['wine_details']['Row']
export type SpiritsDetails    = Database['public']['Tables']['spirits_details']['Row']
export type SoftDrinkDetails  = Database['public']['Tables']['soft_drink_details']['Row']

// Insert / Update 型エイリアス
export type ProductInsert        = Database['public']['Tables']['products']['Insert']
export type ProductUpdate        = Database['public']['Tables']['products']['Update']
export type WineDetailsInsert    = Database['public']['Tables']['wine_details']['Insert']
export type WineDetailsUpdate    = Database['public']['Tables']['wine_details']['Update']
export type SpiritsDetailsInsert = Database['public']['Tables']['spirits_details']['Insert']
export type SpiritsDetailsUpdate = Database['public']['Tables']['spirits_details']['Update']
export type SoftDrinkDetailsInsert = Database['public']['Tables']['soft_drink_details']['Insert']
export type SoftDrinkDetailsUpdate = Database['public']['Tables']['soft_drink_details']['Update']

// wine_details.body の定数ユニオン
export type WineBody = 'light' | 'medium' | 'full'

// 結合型
export type ProductWithRelations = Product & {
  categories: Pick<Category, 'name' | 'name_en'> | null
  suppliers:  Pick<Supplier, 'name'> | null
  stock:      Pick<Stock, 'quantity' | 'min_quantity'> | Pick<Stock, 'quantity' | 'min_quantity'>[] | null
}

export type ProductWithWine = Product & {
  wine_details: WineDetails | null
  categories:   Pick<Category, 'name' | 'name_en'> | null
}

export type ProductWithSpirits = Product & {
  spirits_details: SpiritsDetails | null
  categories:      Pick<Category, 'name' | 'name_en'> | null
}

export type ProductWithSoftDrink = Product & {
  soft_drink_details: SoftDrinkDetails | null
  categories:         Pick<Category, 'name' | 'name_en'> | null
}

/** カテゴリに応じた詳細を含む汎用結合型（いずれか 1 つが非 null になる） */
export type ProductWithDetails = Product & {
  categories:         Pick<Category, 'name' | 'name_en'> | null
  suppliers:          Pick<Supplier, 'name'> | null
  wine_details:       WineDetails | null
  spirits_details:    SpiritsDetails | null
  soft_drink_details: SoftDrinkDetails | null
}

export type PurchaseOrderWithDetails = PurchaseOrder & {
  suppliers: Supplier
  purchase_order_items: (PurchaseOrderItem & { products: Product })[]
}
