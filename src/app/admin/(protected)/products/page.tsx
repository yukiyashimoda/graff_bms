import { createServiceClient } from '@/lib/supabase/server'
import { ProductsPageClient } from '@/components/admin/products/ProductsPageClient'
import type { ProductWithRelations } from '@/lib/types/database'
import type { GlassRow, ProductOption } from '@/components/admin/products/GlassesClient'
import type { CocktailRow } from '@/components/admin/products/CocktailsClient'

const ML_PER: Record<string, number> = { ml: 1, cl: 10, oz: 29.57, dash: 0.6, tsp: 5 }

function calcIngCost(qty: number, unit: string, cost: number | null, vol: number | null): number | null {
  if (!cost || qty <= 0) return null
  const f = ML_PER[unit]
  if (f !== undefined) return vol ? (cost / vol) * qty * f : null
  return cost * qty
}

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

    // カクテルタブ用（材料・在庫含む）
    sb
      .from('cocktails')
      .select('id, name, name_en, description, selling_price, image_url, tags, is_available, sort_order, recipe_steps, cocktail_ingredients(id, product_id, quantity, unit, products(name, cost_price, spirits_details(volume_ml), soft_drink_details(volume_ml), stock(quantity)))')
      .order('sort_order', { ascending: true }),
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
    stock:     (Array.isArray(p.stock) ? p.stock[0]?.quantity : p.stock?.quantity) ?? 0,
    volume_ml: (Array.isArray(p.spirits_details) ? p.spirits_details[0]?.volume_ml : p.spirits_details?.volume_ml)
            ?? (Array.isArray(p.soft_drink_details) ? p.soft_drink_details[0]?.volume_ml : p.soft_drink_details?.volume_ml)
            ?? null,
    category:  p.categories?.name ?? null,
  }))

  /* ── カクテル行を整形 ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cocktails: CocktailRow[] = ((cocktailsRaw ?? []) as any[]).map((row) => {
    const rawIngs = Array.isArray(row.cocktail_ingredients)
      ? row.cocktail_ingredients
      : (row.cocktail_ingredients ? [row.cocktail_ingredients] : [])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ingredients = rawIngs.map((ing: any, idx: number) => {
      const p = ing.products
      const vol = (Array.isArray(p?.spirits_details)    ? p.spirits_details[0]?.volume_ml    : p?.spirits_details?.volume_ml)
               ?? (Array.isArray(p?.soft_drink_details) ? p.soft_drink_details[0]?.volume_ml : p?.soft_drink_details?.volume_ml)
               ?? null
      return {
        id:           ing.id ?? `ing-${idx}`,
        product_id:   ing.product_id,
        product_name: p?.name ?? '',
        quantity:     ing.quantity,
        unit:         ing.unit,
        cost_price:   p?.cost_price ?? null,
        volume_ml:    vol,
        stock:        (Array.isArray(p?.stock) ? p.stock[0]?.quantity : p?.stock?.quantity) ?? 0,
      }
    })

    let totalCostAcc = 0
    let costKnown = true
    for (const ing of ingredients) {
      const ingCost = calcIngCost(ing.quantity, ing.unit, ing.cost_price, ing.volume_ml)
      if (ingCost == null) { costKnown = false; break }
      totalCostAcc += ingCost
    }
    const total_cost: number | null = costKnown ? totalCostAcc : null
    const cost_rate_pct = total_cost != null && row.selling_price ? (total_cost / row.selling_price) * 100 : null

    return {
      id:            row.id,
      name:          row.name,
      name_en:       row.name_en ?? '',
      description:   row.description ?? '',
      selling_price: row.selling_price,
      image_url:     row.image_url ?? null,
      tags:          row.tags ?? [],
      is_available:  row.is_available ?? true,
      sort_order:    row.sort_order ?? 0,
      recipe_steps:  row.recipe_steps ?? [],
      ingredients,
      total_cost,
      cost_rate_pct,
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
