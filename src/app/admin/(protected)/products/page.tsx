import { createServiceClient } from '@/lib/supabase/server'
import { ProductsClient } from '@/components/admin/products/ProductsClient'
import type { ProductWithRelations } from '@/lib/types/database'

export default async function ProductsPage() {
  const supabase = await createServiceClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, name_en, selling_price, display_out_of_stock, is_available, categories(name, name_en), suppliers!supplier_id(name), stock(quantity, min_quantity)')
    .order('created_at', { ascending: false })

  if (error) console.error('[ProductsPage] Supabase error:', error.message)

  return <ProductsClient products={(products ?? []) as unknown as ProductWithRelations[]} />
}
