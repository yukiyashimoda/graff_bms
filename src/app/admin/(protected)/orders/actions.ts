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

  revalidatePath('/admin/orders/history')
  revalidatePath('/admin/orders')
  redirect('/admin/orders')
}

export async function updateOrderStatus(
  orderId: string,
  status: 'draft' | 'sent' | 'received' | 'cancelled',
) {
  const supabase = await createServiceClient()
  await supabase.from('purchase_orders').update({ status }).eq('id', orderId)
  revalidatePath('/admin/orders/history')
  revalidatePath('/admin/orders')
}

export async function receiveOrder(orderId: string) {
  const supabase = await createServiceClient()

  // 全品目の入庫 + 発注書ステータス更新をDB関数で一括実行（品目数 × N往復 → 1往復）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('receive_purchase_order', {
    p_order_id: orderId,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/admin/orders/history')
  revalidatePath('/admin/orders')
  revalidatePath('/admin/stock')
  revalidatePath('/admin')
}

export async function deleteOrder(orderId: string) {
  const supabase = await createServiceClient()
  await supabase.from('purchase_orders').delete().eq('id', orderId)
  revalidatePath('/admin/orders/history')
  revalidatePath('/admin/orders')
}

export async function updateItemInspectionStatus(
  itemId: string,
  status: 'arrived' | 'partial' | 'missing' | 'price_changed' | null,
) {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('purchase_order_items')
    .update({ inspection_status: status })
    .eq('id', itemId)
  revalidatePath('/admin/orders')
}

// カートから業者ごとに発注書を一括作成（業者数 × 2往復 → 1往復）
export async function createOrdersFromCart(
  cartItems: {
    product_id:  string
    supplier_id: string
    quantity:    number
    unit_price:  number | null
  }[]
): Promise<{ count: number }> {
  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('create_orders_from_cart', {
    p_cart_items: cartItems,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/admin/orders/history')
  revalidatePath('/admin/orders')
  return { count: Number(data) }
}
