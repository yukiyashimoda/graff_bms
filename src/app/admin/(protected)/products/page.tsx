import { createServiceClient } from '@/lib/supabase/server'
import { ProductsPageClient } from '@/components/admin/products/ProductsPageClient'
import type { ProductWithRelations } from '@/lib/types/database'
import type { GlassRow } from '@/components/admin/products/GlassesClient'
import type { CocktailRow } from '@/components/admin/products/CocktailsClient'

export default async function ProductsPage() {
  const supabase = await createServiceClient()

  const [
    { data: products, error: prodError },
    { data: glasses,  error: glassError },
    { data: cocktailsRaw, error: cocktailError },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, name_en, cost_price, display_out_of_stock, is_available, categories(name, name_en), suppliers!supplier_id(name), stock(quantity, min_quantity)')
      .order('name', { ascending: true }),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('glasses')
      .select('id, name, name_en, type, size_ml, image_url, notes, is_available, sort_order')
      .order('sort_order', { ascending: true }),

    supabase
      .from('cocktail_cost_view')
      .select('cocktail_id, name, name_en, selling_price, total_cost, cost_rate_pct'),
  ])

  if (prodError)    console.error('[ProductsPage] products error:',  prodError.message)
  if (glassError)   console.error('[ProductsPage] glasses error:',   glassError)
  if (cocktailError) console.error('[ProductsPage] cocktails error:', cocktailError.message)

  // cocktail_cost_view にない詳細カラムを cocktails テーブルから補完
  const { data: cocktailDetails } = await supabase
    .from('cocktails')
    .select('id, description, image_url, tags, is_available, sort_order')
    .order('sort_order', { ascending: true })

  const detailMap = new Map((cocktailDetails ?? []).map(d => [d.id, d]))

  const cocktails: CocktailRow[] = (cocktailsRaw ?? []).map(v => {
    const d = detailMap.get(v.cocktail_id)
    return {
      id:            v.cocktail_id,
      name:          v.name,
      name_en:       v.name_en,
      description:   d?.description   ?? '',
      selling_price: v.selling_price,
      image_url:     d?.image_url     ?? null,
      tags:          d?.tags          ?? [],
      is_available:  d?.is_available  ?? true,
      sort_order:    d?.sort_order    ?? 0,
      total_cost:    v.total_cost,
      cost_rate_pct: v.cost_rate_pct,
    }
  })

  return (
    <ProductsPageClient
      products={(products ?? []) as unknown as ProductWithRelations[]}
      glasses={(glasses ?? []) as GlassRow[]}
      cocktails={cocktails}
    />
  )
}
