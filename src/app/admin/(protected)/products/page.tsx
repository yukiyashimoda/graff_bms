import { createServiceClient } from '@/lib/supabase/server'
import { ProductsPageClient } from '@/components/admin/products/ProductsPageClient'
import type { ProductWithRelations } from '@/lib/types/database'
import type { GlassRow, ProductOption } from '@/components/admin/products/GlassesClient'
import type { CocktailRow } from '@/components/admin/products/CocktailsClient'

export default async function ProductsPage() {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [
    { data: products },
    { data: glassesRaw },
    { data: productOptions },
    { data: cocktailsRaw },
  ] = await Promise.all([
    // 商品一覧タブ用
    supabase
      .from('products')
      .select('id, name, name_en, cost_price, display_out_of_stock, is_available, categories(name, name_en), suppliers!supplier_id(name), stock(quantity, min_quantity)')
      .order('name', { ascending: true }),

    // グラス一覧（products / categories ジョイン）
    sb
      .from('glasses')
      .select('id, product_id, serving_ml, bottle_ml, selling_price, opened_at, is_available, products!inner(name, name_en, cost_price, categories(name))')
      .order('opened_at', { ascending: false }),

    // Stepperステップ1用：全商品オプション（volume_ml含む）
    supabase
      .from('products')
      .select('id, name, name_en, cost_price, categories(name), stock(quantity), spirits_details(volume_ml), soft_drink_details(volume_ml)')
      .order('name', { ascending: true }),

    // カクテルタブ用
    supabase
      .from('cocktail_cost_view')
      .select('cocktail_id, name, name_en, selling_price, total_cost, cost_rate_pct'),
  ])

  /* ── グラス行を整形 ── */
  const glasses: GlassRow[] = (glassesRaw ?? []).map((r: {
    id: string; product_id: string; serving_ml: number; bottle_ml: number | null
    selling_price: number | null; opened_at: string; is_available: boolean
    products: { name: string; name_en: string; cost_price: number | null; categories: { name: string } | null }
  }) => ({
    id:              r.id,
    product_id:      r.product_id,
    product_name:    r.products.name,
    product_name_en: r.products.name_en,
    cost_price:      r.products.cost_price,
    serving_ml:      r.serving_ml,
    bottle_ml:       r.bottle_ml,
    selling_price:   r.selling_price,
    opened_at:       r.opened_at,
    is_available:    r.is_available,
    category_name:   r.products.categories?.name ?? null,
  }))

  /* ── Stepper用商品オプションを整形 ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productOptionList: ProductOption[] = ((productOptions ?? []) as any[]).map((p) => ({
    id:        p.id,
    name:      p.name,
    name_en:   p.name_en,
    cost_price: p.cost_price,
    stock:     p.stock?.[0]?.quantity ?? 0,
    volume_ml: p.spirits_details?.[0]?.volume_ml ?? p.soft_drink_details?.[0]?.volume_ml ?? null,
    category:  p.categories?.name ?? null,
  }))

  /* ── カクテル行を整形 ── */
  const { data: cocktailDetails } = await supabase
    .from('cocktails')
    .select('id, description, image_url, tags, is_available, sort_order')
    .order('sort_order', { ascending: true })

  const detailMap = new Map((cocktailDetails ?? []).map((d: { id: string }) => [d.id, d]))

  const cocktails: CocktailRow[] = (cocktailsRaw ?? []).map((v: {
    cocktail_id: string; name: string; name_en: string
    selling_price: number | null; total_cost: number; cost_rate_pct: number | null
  }) => {
    const d = detailMap.get(v.cocktail_id) as { description: string; image_url: string | null; tags: string[]; is_available: boolean; sort_order: number } | undefined
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
      glasses={glasses}
      productOptions={productOptionList}
      cocktails={cocktails}
    />
  )
}
