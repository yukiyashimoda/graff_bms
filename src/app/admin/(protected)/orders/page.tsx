import { createServiceClient } from '@/lib/supabase/server'
import { OrderCart } from '@/components/admin/orders/OrderCart'

export default async function OrdersPage() {
  const supabase = await createServiceClient()

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, name_en, unit, cost_price,
      categories(name),
      suppliers!supplier_id(id, name),
      stock(quantity, min_quantity)
    `)
    .order('name')

  function resolveStock(raw: unknown) {
    if (!raw) return { quantity: 0, min_quantity: 0 }
    const obj = Array.isArray(raw) ? (raw[0] ?? {}) : raw
    return obj as { quantity: number; min_quantity: number }
  }
  function resolveSupplier(raw: unknown) {
    if (!raw) return null
    const obj = Array.isArray(raw) ? (raw[0] ?? null) : raw
    return obj as { id: string; name: string } | null
  }

  const cartItems = (products ?? []).map(p => ({
    id:            p.id,
    name:          p.name,
    name_en:       p.name_en ?? '',
    unit:          p.unit ?? '本',
    cost_price:    p.cost_price != null ? Number(p.cost_price) : null,
    category_name: (p.categories as unknown as { name: string } | null)?.name ?? null,
    supplier_id:   resolveSupplier(p.suppliers)?.id   ?? null,
    supplier_name: resolveSupplier(p.suppliers)?.name ?? null,
    quantity:      Number(resolveStock(p.stock).quantity),
    min_quantity:  Number(resolveStock(p.stock).min_quantity),
  }))

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>発注管理</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>発注する商品を選んで発注書を作成</p>
      </div>

      {/* カート */}
      <OrderCart items={cartItems} />
    </div>
  )
}
