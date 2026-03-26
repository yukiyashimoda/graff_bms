import { createServiceClient } from '@/lib/supabase/server'
import { OrdersPageClient } from '@/components/admin/orders/OrdersPageClient'
import { getIssuerProfile } from './issuer-actions'

export default async function OrdersPage() {
  const supabase = await createServiceClient()
  const issuerProfile = await getIssuerProfile()

  const [
    { data: products },
    { data: orders },
    { data: suppliers },
  ] = await Promise.all([
    supabase
      .from('products')
      .select(`
        id, name, name_en, unit, cost_price,
        categories(name),
        suppliers!supplier_id(id, name),
        stock(quantity, min_quantity)
      `)
      .order('name'),

    supabase
      .from('purchase_orders')
      .select(`
        id, status, order_date, expected_date, created_at, notes,
        suppliers!supplier_id(name),
        purchase_order_items(id, quantity, unit_price, inspection_status, products(name, unit))
      `)
      .order('created_at', { ascending: false }),

    supabase
      .from('suppliers')
      .select('id, name, name_en, contact_name, phone, address, notes')
      .order('name'),
  ])

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

  const orderRows = (orders ?? []).map(o => {
    const sup   = o.suppliers as unknown as { name: string } | null
    const items = o.purchase_order_items as unknown as {
      id: string; quantity: number; unit_price: number | null
      inspection_status: string | null
      products: { name: string; unit: string }
    }[]
    return {
      id:            o.id,
      status:        o.status as 'draft' | 'sent' | 'received' | 'cancelled',
      order_date:    o.order_date,
      expected_date: o.expected_date ?? null,
      created_at:    o.created_at,
      notes:         o.notes ?? null,
      supplier_name: sup?.name ?? null,
      items: (items ?? []).map(i => ({
        id:                i.id,
        quantity:          i.quantity,
        unit_price:        i.unit_price ?? null,
        product_name:      i.products.name,
        product_unit:      i.products.unit,
        inspection_status: (i.inspection_status ?? null) as 'arrived' | 'partial' | 'missing' | 'price_changed' | null,
      })),
    }
  })

  return (
    <OrdersPageClient
      cartItems={cartItems}
      orders={orderRows}
      suppliers={suppliers ?? []}
      issuerProfile={issuerProfile}
    />
  )
}
