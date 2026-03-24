import { createServiceClient } from '@/lib/supabase/server'
import { StockGrid } from '@/components/admin/stock/StockGrid'

export default async function StockPage() {
  const supabase = await createServiceClient()

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id, name, name_en, unit, image_url,
      categories(name),
      stock(quantity, min_quantity)
    `)
    .order('name')

  if (error) console.error('[StockPage] Supabase error:', error.message)

  const items = (products ?? []).map(p => {
    const stockRaw = p.stock as unknown
    // PostgREST may return single object or array for 1:1 join
    const stockObj: { quantity: number; min_quantity: number } | null =
      Array.isArray(stockRaw) ? (stockRaw[0] ?? null) : (stockRaw as { quantity: number; min_quantity: number } | null)

    return {
      id:            p.id,
      name:          p.name,
      name_en:       p.name_en ?? '',
      unit:          p.unit,
      image_url:     p.image_url,
      category_name: (p.categories as unknown as { name: string } | null)?.name ?? null,
      quantity:      stockObj?.quantity      ?? 0,
      min_quantity:  stockObj?.min_quantity  ?? 0,
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
