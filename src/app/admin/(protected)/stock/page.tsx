import { createServiceClient } from '@/lib/supabase/server'
import { StockGrid } from '@/components/admin/stock/StockGrid'

export default async function StockPage() {
  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [
    { data: products, error },
    { data: batchRows },
  ] = await Promise.all([
    supabase
      .from('products')
      .select(`
        id, name, name_en, unit, image_url, cost_price,
        categories(name),
        stock(quantity, min_quantity)
      `)
      .order('name'),
    sb
      .from('inventory_batches')
      .select('product_id, cost_price, quantity_rem, received_at')
      .gt('quantity_rem', 0)
      .order('received_at', { ascending: true }),
  ])

  if (error) console.error('[StockPage] Supabase error:', error.message)

  // product_id ごとにロットをグループ化
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
      quantity:      stockObj?.quantity      ?? 0,
      min_quantity:  stockObj?.min_quantity  ?? 0,
      batches:       batchMap.get(p.id) ?? [],
    }
  })

  const lowCount = items.filter(i => i.quantity < i.min_quantity).length

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>入出庫管理</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {items.length} 件
          {lowCount > 0 && (
            <span className="ml-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
              — 在庫不足 {lowCount} 件
            </span>
          )}
        </p>
      </div>

      <StockGrid items={items} />
    </div>
  )
}
