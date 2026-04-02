import { createServiceClient } from '@/lib/supabase/server'
import { StockPageClient } from '@/components/admin/stock/StockPageClient'

export default async function StockPage() {
  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const since = new Date()
  since.setMonth(since.getMonth() - 6)

  const [
    { data: products, error },
    { data: batchRows },
    { data: transactions },
  ] = await Promise.all([
    supabase
      .from('products')
      .select(`
        id, name, name_en, unit, image_url, cost_price, supplier_id,
        categories(name),
        stock(quantity, min_quantity)
      `)
      .order('name'),
    sb
      .from('inventory_batches')
      .select('product_id, cost_price, quantity_rem, received_at')
      .gt('quantity_rem', 0)
      .order('received_at', { ascending: true }),
    supabase
      .from('stock_transactions')
      .select(`
        id, type, quantity, cost_price, notes, created_at,
        products(name, name_en, unit, categories(name))
      `)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false }),
  ])

  if (error) console.error('[StockPage] Supabase error:', error.message)

  // ── 在庫グリッド用
  const batchMap = new Map<string, { cost_price: number; quantity_rem: number; received_at: string }[]>()
  for (const b of (batchRows ?? [])) {
    const list = batchMap.get(b.product_id) ?? []
    list.push({
      cost_price:   Number(b.cost_price),
      quantity_rem: Number(b.quantity_rem),
      received_at:  b.received_at,
    })
    batchMap.set(b.product_id, list)
  }

  const items = (products ?? []).map(p => {
    const stockRaw = p.stock as unknown
    const stockObj: { quantity: number; min_quantity: number } | null =
      Array.isArray(stockRaw) ? (stockRaw[0] ?? null) : (stockRaw as { quantity: number; min_quantity: number } | null)

    return {
      id:            p.id,
      name:          p.name,
      name_en:       p.name_en ?? '',
      unit:          p.unit,
      image_url:     p.image_url,
      category_name: (p.categories as unknown as { name: string } | null)?.name ?? null,
      cost_price:    p.cost_price != null ? Number(p.cost_price) : null,
      supplier_id:   (p as unknown as { supplier_id: string | null }).supplier_id ?? null,
      quantity:      stockObj?.quantity      ?? 0,
      min_quantity:  stockObj?.min_quantity  ?? 0,
      batches:       batchMap.get(p.id) ?? [],
    }
  })

  const lowCount = items.filter(i => i.quantity < i.min_quantity).length

  // ── 履歴用
  const txRows = (transactions ?? []).map(t => {
    const p = t.products as unknown as {
      name: string; name_en: string; unit: string
      categories: { name: string } | null
    } | null
    return {
      id:               t.id,
      type:             t.type as 'in' | 'out' | 'adjustment',
      quantity:         Number(t.quantity),
      cost_price:       t.cost_price != null ? Number(t.cost_price) : null,
      notes:            t.notes,
      created_at:       t.created_at,
      product_name:     p?.name    ?? '—',
      product_name_en:  p?.name_en ?? '',
      unit:             p?.unit    ?? '',
      product_category: p?.categories?.name ?? null,
    }
  })

  return (
    <StockPageClient
      items={items}
      transactions={txRows}
      lowCount={lowCount}
    />
  )
}
