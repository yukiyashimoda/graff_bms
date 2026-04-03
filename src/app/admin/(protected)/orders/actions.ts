'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

type OrderItem = {
  product_id: string
  quantity: number
  unit_price: number | null
  notes?: string | null
}

export async function createOrder(params: {
  supplier_id:   string
  order_date:    string
  expected_date: string | null
  notes:         string | null
  items: {
    product_id:  string
    quantity:    number
    unit_price:  number | null
    notes?:      string | null
  }[]
}): Promise<{ id: string }> {
  const supabase = await createServiceClient()

  const { data: order, error } = await supabase
    .from('purchase_orders')
    .insert({
      supplier_id:   params.supplier_id,
      status:        'draft',
      order_date:    params.order_date || new Date().toISOString().split('T')[0],
      expected_date: params.expected_date,
      notes:         params.notes,
    })
    .select('id')
    .single()

  if (error || !order) throw new Error('発注書の作成に失敗しました')

  if (params.items.length > 0) {
    await supabase.from('purchase_order_items').insert(
      params.items.map(item => ({
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
  return { id: order.id }
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  await supabase
    .from('purchase_order_items')
    .update({ inspection_status: status })
    .eq('id', itemId)

  // 終売設定時: 全品目完了ならオーダーを received に更新
  if (status === 'missing') {
    const { data: item } = await supabase
      .from('purchase_order_items')
      .select('purchase_order_id')
      .eq('id', itemId)
      .single()

    if (item) {
      const { data: siblings } = await supabase
        .from('purchase_order_items')
        .select('quantity, received_quantity, inspection_status')
        .eq('purchase_order_id', item.purchase_order_id)

      const allDone = (siblings ?? []).every(
        (s: { quantity: number; received_quantity: number; inspection_status: string | null }) =>
          Number(s.received_quantity) >= Number(s.quantity) || s.inspection_status === 'missing'
      )
      if (allDone) {
        await supabase
          .from('purchase_orders')
          .update({ status: 'received' })
          .eq('id', item.purchase_order_id)
      }
    }
  }

  revalidatePath('/admin/orders')
}

// 品目単位の入庫処理（一部到着・価格改定対応）
export async function receiveOrderItem(
  itemId: string,
  receiveQty: number,
  unitPrice: number | null,
  isPriceChange: boolean = false,
): Promise<{ newReceivedQty: number; fullyReceived: boolean }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const { data: item } = await supabase
    .from('purchase_order_items')
    .select('product_id, quantity, received_quantity, unit_price, purchase_order_id')
    .eq('id', itemId)
    .single()
  if (!item) throw new Error('Item not found')

  const effectivePrice = unitPrice ?? item.unit_price ?? null
  const newReceivedQty  = Number(item.received_quantity) + receiveQty
  const fullyReceived   = newReceivedQty >= Number(item.quantity)

  // 在庫入庫 (price_history / alerts は DB トリガーが自動更新)
  await supabase.rpc('process_stock_transaction', {
    p_product_id: item.product_id,
    p_type:       'in',
    p_quantity:   receiveQty,
    p_cost_price: effectivePrice,
    p_notes:      isPriceChange ? '価格改定入庫' : null,
  })

  // 品目更新
  const patch: Record<string, unknown> = {
    received_quantity: newReceivedQty,
    inspection_status: fullyReceived ? 'arrived' : 'partial',
  }
  if (unitPrice != null) patch.unit_price = unitPrice
  await supabase.from('purchase_order_items').update(patch).eq('id', itemId)

  // 全品目が受領済み or 終売ならオーダーを received に更新
  const { data: siblings } = await supabase
    .from('purchase_order_items')
    .select('id, quantity, received_quantity, inspection_status')
    .eq('purchase_order_id', item.purchase_order_id)

  const allDone = (siblings ?? []).every((s: { id: string; quantity: number; received_quantity: number; inspection_status: string | null }) => {
    if (s.id === itemId) return fullyReceived
    return Number(s.received_quantity) >= Number(s.quantity) || s.inspection_status === 'missing'
  })
  if (allDone) {
    await supabase
      .from('purchase_orders')
      .update({ status: 'received' })
      .eq('id', item.purchase_order_id)
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin/stock')
  revalidatePath('/admin')
  return { newReceivedQty, fullyReceived }
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
