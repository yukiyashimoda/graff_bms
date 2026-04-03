import { createServiceClient } from '@/lib/supabase/server'
import { getIssuerProfile } from '@/app/admin/(protected)/orders/issuer-actions'
import { PrintPageClient } from '@/components/admin/orders/PrintPageClient'

export default async function OrderPrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: order } = await supabase
    .from('purchase_orders')
    .select(`
      id, status, order_date, expected_date, notes,
      suppliers!supplier_id(name, address, contact_name, phone),
      purchase_order_items(id, quantity, products(name, unit))
    `)
    .eq('id', id)
    .single()

  if (!order) return <div className="p-8">発注書が見つかりません</div>

  const supplier = order.suppliers as unknown as {
    name: string; address: string | null; contact_name: string | null; phone: string | null
  } | null
  const items = order.purchase_order_items as unknown as {
    id: string; quantity: number; products: { name: string; unit: string }
  }[]
  const issuer = await getIssuerProfile()

  return (
    <PrintPageClient
      order={{
        id:            order.id,
        order_date:    order.order_date,
        expected_date: order.expected_date ?? null,
        notes:         order.notes ?? null,
        supplier,
        items,
      }}
      issuer={issuer}
    />
  )
}
