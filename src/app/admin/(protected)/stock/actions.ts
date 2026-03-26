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
  const { data, error } = await (supabase as any).rpc('process_stock_transaction', {
    p_product_id: productId,
    p_type:       type,
    p_quantity:   quantity,
    p_cost_price: costPrice ?? null,
    p_notes:      notes ?? null,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/admin/stock')
  revalidatePath('/admin')
  revalidatePath('/ja', 'page')
  revalidatePath('/en', 'page')
  return { newQuantity: Number(data) }
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

export async function batchStockTransactions(
  items: { productId: string; type: 'in' | 'out'; quantity: number }[],
): Promise<{ results: { id: string; newQuantity: number }[] }> {
  const supabase = await createServiceClient()
  const results: { id: string; newQuantity: number }[] = []

  for (const item of items) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('process_stock_transaction', {
      p_product_id: item.productId,
      p_type:       item.type,
      p_quantity:   item.quantity,
      p_cost_price: null,
      p_notes:      null,
    })
    if (error) throw new Error(error.message)
    results.push({ id: item.productId, newQuantity: Number(data) })
  }

  // 一括でまとめて revalidate（N回 → 1回）
  revalidatePath('/admin/stock')
  revalidatePath('/admin')
  revalidatePath('/ja', 'page')
  revalidatePath('/en', 'page')

  return { results }
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
