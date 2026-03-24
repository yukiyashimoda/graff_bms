'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * 入出庫トランザクションを記録する
 *
 * 価格関連の副作用（price_history / price_alerts / products.cost_price）は
 * DBトリガー (trg_check_price_alert) が一元管理するため、JS側では行わない。
 * ロット (inventory_batches) の追加・FIFO減算のみ JS 側で処理する。
 */
export async function recordStockTransaction(
  productId: string,
  type: 'in' | 'out' | 'adjustment',
  quantity: number,
  costPrice?: number | null,
  notes?: string | null,
): Promise<{ newQuantity: number }> {
  const supabase = await createServiceClient()

  const { data: stock } = await supabase
    .from('stock')
    .select('quantity')
    .eq('product_id', productId)
    .maybeSingle()

  const current = Number(stock?.quantity ?? 0)
  let newQuantity: number

  if (type === 'in')        newQuantity = current + quantity
  else if (type === 'out')  newQuantity = Math.max(0, current - quantity)
  else                      newQuantity = quantity

  const { error: upsertError } = await supabase.from('stock').upsert(
    { product_id: productId, quantity: newQuantity },
    { onConflict: 'product_id' },
  )
  if (upsertError) throw new Error(upsertError.message)

  // stock_transactions に記録
  // type='in' & quantity>0 & cost_price ありの場合、DBトリガーが price_history / price_alerts / products.cost_price を自動更新
  await supabase.from('stock_transactions').insert({
    product_id: productId,
    type,
    quantity,
    cost_price: costPrice ?? null,
    notes:      notes ?? null,
  })

  // 入庫: ロット（inventory_batches）を新規作成
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  if (type === 'in' && quantity > 0) {
    await sb.from('inventory_batches').insert({
      product_id:   productId,
      cost_price:   costPrice ?? 0,
      quantity_in:  quantity,
      quantity_rem: quantity,
      notes:        notes ?? null,
    })
  }

  // 出庫: FIFO でロット在庫を減算
  if (type === 'out' && quantity > 0) {
    const { data: batches } = await sb
      .from('inventory_batches')
      .select('id, quantity_rem')
      .eq('product_id', productId)
      .gt('quantity_rem', 0)
      .order('received_at', { ascending: true })

    let remaining = quantity
    for (const batch of (batches ?? [])) {
      if (remaining <= 0) break
      const deduct  = Math.min(remaining, Number(batch.quantity_rem))
      await sb
        .from('inventory_batches')
        .update({ quantity_rem: Number(batch.quantity_rem) - deduct })
        .eq('id', batch.id)
      remaining -= deduct
    }
  }

  revalidatePath('/admin/stock')
  revalidatePath('/admin')
  return { newQuantity }
}

/**
 * 価格改定のみを記録する（在庫数は変えない）
 *
 * stock_transactions は使わず（ロットを作らないため）、
 * price_history / price_alerts / products.cost_price を直接更新する。
 */
export async function recordPriceRevision(
  productId: string,
  newPrice: number,
  notes?: string,
): Promise<void> {
  const supabase = await createServiceClient()

  // 現在価格を取得してアラート判定に使う
  const { data: latest } = await supabase
    .from('price_history')
    .select('cost_price')
    .eq('product_id', productId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const prevPrice = latest?.cost_price != null ? Number(latest.cost_price) : null

  // price_history に記録
  const { error: histErr } = await supabase.from('price_history').insert({ product_id: productId, cost_price: newPrice })
  if (histErr) throw new Error(histErr.message)

  // products.cost_price を更新
  const { error: prodErr } = await supabase.from('products').update({ cost_price: newPrice }).eq('id', productId)
  if (prodErr) throw new Error(prodErr.message)

  // 5% 以上値上がりならアラート発行
  if (prevPrice != null && prevPrice > 0) {
    const changeRate = (newPrice - prevPrice) / prevPrice
    if (changeRate >= 0.05) {
      await supabase.from('price_alerts').insert({
        product_id:     productId,
        previous_price: prevPrice,
        new_price:      newPrice,
        change_rate:    changeRate,
      })
    }
  }

  revalidatePath('/admin/stock')
  revalidatePath('/admin')
}

export async function updateMinQuantity(productId: string, minQuantity: number) {
  const supabase = await createServiceClient()
  await supabase.from('stock').upsert(
    { product_id: productId, min_quantity: minQuantity },
    { onConflict: 'product_id' },
  )
  revalidatePath('/admin/stock')
}
