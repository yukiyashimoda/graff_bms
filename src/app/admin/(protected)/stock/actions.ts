'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * 入出庫トランザクションを記録する
 *
 * ロット（inventory_batches）の更新ルール:
 * - 入庫 & 最新バッチと同じ価格 → 最新バッチの数量に加算
 * - 入庫 & 価格が異なる（価格改定） → 新しいバッチを作成
 * - 出庫 → FIFO で古いバッチから減算
 *
 * 価格関連の副作用（price_history / price_alerts / products.cost_price）は
 * DBトリガー (trg_check_price_alert) が一元管理する。
 */
export async function recordStockTransaction(
  productId: string,
  type: 'in' | 'out' | 'adjustment',
  quantity: number,
  costPrice?: number | null,
  notes?: string | null,
): Promise<{ newQuantity: number }> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

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

  // 入庫: 先にロット情報を取得して実効価格を確定する
  let effectiveCostPrice: number | null = costPrice ?? null

  if (type === 'in' && quantity > 0) {
    const { data: latest } = await sb
      .from('inventory_batches')
      .select('id, quantity_rem, quantity_in, cost_price')
      .eq('product_id', productId)
      .order('received_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const latestPrice   = latest ? Number(latest.cost_price) : null
    const incomingPrice = costPrice != null ? costPrice : latestPrice

    // effectiveCostPrice: 履歴・トリガーに渡す実際の価格
    if (incomingPrice != null) {
      effectiveCostPrice = incomingPrice
    } else {
      // バッチも price も未設定 → products から取得
      const { data: prod } = await supabase.from('products').select('cost_price').eq('id', productId).maybeSingle()
      effectiveCostPrice = Number(prod?.cost_price ?? 0) || null
    }

    if (latest && incomingPrice === latestPrice) {
      // 同じ価格 → 最新バッチに加算
      await sb.from('inventory_batches')
        .update({
          quantity_rem: Number(latest.quantity_rem) + quantity,
          quantity_in:  Number(latest.quantity_in)  + quantity,
        })
        .eq('id', latest.id)
    } else {
      // 価格が異なる or バッチ未作成 → 新しいバッチを作成
      await sb.from('inventory_batches').insert({
        product_id:   productId,
        cost_price:   effectiveCostPrice ?? 0,
        quantity_in:  quantity,
        quantity_rem: quantity,
        notes:        notes ?? null,
      })
    }
  }

  // stock_transactions に記録
  // type='in' & quantity>0 & cost_price ありの場合、DBトリガーが price_history / price_alerts / products.cost_price を自動更新
  await supabase.from('stock_transactions').insert({
    product_id: productId,
    type,
    quantity,
    cost_price: effectiveCostPrice,
    notes:      notes ?? null,
  })

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
      const deduct = Math.min(remaining, Number(batch.quantity_rem))
      await sb.from('inventory_batches')
        .update({ quantity_rem: Number(batch.quantity_rem) - deduct })
        .eq('id', batch.id)
      remaining -= deduct
    }
  }

  revalidatePath('/admin/stock')
  revalidatePath('/admin')
  revalidatePath('/ja', 'page')
  revalidatePath('/en', 'page')
  return { newQuantity }
}

/**
 * 価格改定のみを記録する（在庫数は変えない）
 * UIからは使用しないが、将来の拡張用に保持
 */
export async function recordPriceRevision(
  productId: string,
  newPrice: number,
  notes?: string,
): Promise<void> {
  const supabase = await createServiceClient()

  const { data: latest } = await supabase
    .from('price_history')
    .select('cost_price')
    .eq('product_id', productId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const prevPrice = latest?.cost_price != null ? Number(latest.cost_price) : null

  const { error: histErr } = await supabase.from('price_history').insert({ product_id: productId, cost_price: newPrice })
  if (histErr) throw new Error(histErr.message)

  const { error: prodErr } = await supabase.from('products').update({ cost_price: newPrice }).eq('id', productId)
  if (prodErr) throw new Error(prodErr.message)

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

export async function deleteStockTransaction(id: string): Promise<void> {
  const supabase = await createServiceClient()
  await supabase.from('stock_transactions').delete().eq('id', id)
  revalidatePath('/admin/stock/history')
  revalidatePath('/admin')
}

export async function deleteMonthTransactions(month: string, password: string): Promise<{ error?: string }> {
  const expected = process.env.BULK_DELETE_PASSWORD
  if (!expected || password !== expected) return { error: 'パスワードが正しくありません' }

  const [y, m] = month.split('-')
  const from = new Date(Number(y), Number(m) - 1, 1).toISOString()
  const to   = new Date(Number(y), Number(m),     1).toISOString()

  const supabase = await createServiceClient()
  await supabase.from('stock_transactions')
    .delete()
    .gte('created_at', from)
    .lt('created_at', to)

  revalidatePath('/admin/stock/history')
  revalidatePath('/admin')
  return {}
}

export async function updateMinQuantity(productId: string, minQuantity: number) {
  const supabase = await createServiceClient()
  await supabase.from('stock').upsert(
    { product_id: productId, min_quantity: minQuantity },
    { onConflict: 'product_id' },
  )
  revalidatePath('/admin/stock')
}
