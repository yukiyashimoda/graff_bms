import { createServiceClient } from '@/lib/supabase/server'
import { PricingClient } from '@/components/admin/pricing/PricingClient'

const ML_PER: Record<string, number> = { ml: 1, cl: 10, oz: 29.57, dash: 0.6, tsp: 5 }

function calcIngCost(qty: number, unit: string, cost: number | null, vol: number | null): number | null {
  if (!cost || qty <= 0) return null
  const f = ML_PER[unit]
  if (f !== undefined) return vol ? (cost / vol) * qty * f : null
  return cost * qty
}

export default async function PricingPage() {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [
    { data: products },
    { data: glassesRaw },
    { data: cocktailsRaw },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, name_en, cost_price, selling_price, categories(name), spirits_details(shot_price, volume_ml)')
      .order('categories(name)', { ascending: true }),

    sb
      .from('glasses')
      .select('id, product_id, serving_ml, bottle_ml, selling_price, products!inner(name, name_en, cost_price)')
      .order('id', { ascending: true }),

    sb
      .from('cocktails')
      .select('id, name, name_en, selling_price, cocktail_ingredients(id, product_id, quantity, unit, products(name, cost_price, spirits_details(volume_ml), soft_drink_details(volume_ml)))')
      .order('sort_order', { ascending: true }),
  ])

  /* ── 商品行 ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productRows = ((products ?? []) as any[]).map(p => {
    const sd = Array.isArray(p.spirits_details) ? p.spirits_details[0] ?? null : p.spirits_details
    return {
      id:            p.id,
      name:          p.name,
      name_en:       p.name_en ?? '',
      cost_price:    p.cost_price,
      selling_price: p.selling_price,
      category_name: p.categories?.name ?? null,
      shot_price:    sd?.shot_price ?? null,
      volume_ml:     sd?.volume_ml  ?? null,
      is_spirits:    sd !== null,
    }
  })

  /* ── グラスワイン行 ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const glassRows = ((glassesRaw ?? []) as any[]).map(r => ({
    id:            r.id,
    product_name:  r.products?.name    ?? '',
    name_en:       r.products?.name_en ?? '',
    cost_price:    r.products?.cost_price ?? null,
    serving_ml:    r.serving_ml,
    bottle_ml:     r.bottle_ml ?? null,
    selling_price: r.selling_price,
  }))

  /* ── カクテル行 ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cocktailRows = ((cocktailsRaw ?? []) as any[]).map(row => {
    const rawIngs = Array.isArray(row.cocktail_ingredients)
      ? row.cocktail_ingredients
      : (row.cocktail_ingredients ? [row.cocktail_ingredients] : [])

    let totalCostAcc = 0
    let costKnown = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const ing of rawIngs as any[]) {
      const p = ing.products
      const vol = (Array.isArray(p?.spirits_details)    ? p.spirits_details[0]?.volume_ml    : p?.spirits_details?.volume_ml)
               ?? (Array.isArray(p?.soft_drink_details) ? p.soft_drink_details[0]?.volume_ml : p?.soft_drink_details?.volume_ml)
               ?? null
      const ingCost = calcIngCost(ing.quantity, ing.unit, p?.cost_price ?? null, vol)
      if (ingCost == null) { costKnown = false; break }
      totalCostAcc += ingCost
    }
    const total_cost: number | null = costKnown ? totalCostAcc : null

    return {
      id:            row.id,
      name:          row.name,
      name_en:       row.name_en ?? '',
      selling_price: row.selling_price,
      total_cost,
    }
  })

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>原価計算</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          販売価格をまとめて設定して原価率を確認できます
        </p>
      </div>
      <PricingClient products={productRows} glasses={glassRows} cocktails={cocktailRows} />
    </div>
  )
}
