'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'

type OrderItem = {
  product_id: string
  quantity: number
  unit_price: number | null
  notes?: string | null
}

export async function createOrder(formData: FormData) {
  const supabase = await createServiceClient()

  const supplier_id   = formData.get('supplier_id')   as string
  const order_date    = formData.get('order_date')    as string
  const expected_date = (formData.get('expected_date') as string) || null
  const notes         = (formData.get('notes')         as string) || null
  const itemsJson     = formData.get('items')          as string
  const items: OrderItem[] = JSON.parse(itemsJson)

  const { data: order, error } = await supabase
    .from('purchase_orders')
    .insert({
      supplier_id,
      status: 'draft',
      order_date: order_date || new Date().toISOString().split('T')[0],
      expected_date,
      notes,
    })
    .select('id')
    .single()

  if (error || !order) throw new Error('発注書の作成に失敗しました')

  if (items.length > 0) {
    await supabase.from('purchase_order_items').insert(
      items.map(item => ({
        purchase_order_id: order.id,
        product_id:        item.product_id,
        quantity:          item.quantity,
        unit_price:        item.unit_price,
        notes:             item.notes ?? null,
      })),
    )
  }

  revalidatePath('/admin/orders')
  redirect('/admin/orders')
}

export async function updateOrderStatus(
  orderId: string,
  status: 'draft' | 'sent' | 'received' | 'cancelled',
) {
  const supabase = await createServiceClient()
  await supabase.from('purchase_orders').update({ status }).eq('id', orderId)
  revalidatePath('/admin/orders')
}

export async function deleteOrder(orderId: string) {
  const supabase = await createServiceClient()
  await supabase.from('purchase_orders').delete().eq('id', orderId)
  revalidatePath('/admin/orders')
}

// カートから業者ごとに発注書を一括作成
export async function createOrdersFromCart(
  cartItems: {
    product_id:  string
    supplier_id: string
    quantity:    number
    unit_price:  number | null
  }[]
): Promise<{ count: number }> {
  const supabase = await createServiceClient()

  // 業者ごとにグループ化
  const bySupplier = new Map<string, typeof cartItems>()
  for (const item of cartItems) {
    if (!bySupplier.has(item.supplier_id)) bySupplier.set(item.supplier_id, [])
    bySupplier.get(item.supplier_id)!.push(item)
  }

  const today = new Date().toISOString().split('T')[0]

  await Promise.all(
    Array.from(bySupplier.entries()).map(async ([supplier_id, items]) => {
      const { data: order } = await supabase
        .from('purchase_orders')
        .insert({ supplier_id, status: 'draft', order_date: today })
        .select('id')
        .single()

      if (order) {
        await supabase.from('purchase_order_items').insert(
          items.map(i => ({
            purchase_order_id: order.id,
            product_id:        i.product_id,
            quantity:          i.quantity,
            unit_price:        i.unit_price,
          }))
        )
      }
    })
  )

  revalidatePath('/admin/orders')
  return { count: bySupplier.size }
}
