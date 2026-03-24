'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

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

  await supabase.from('stock_transactions').insert({
    product_id: productId,
    type,
    quantity,
    cost_price: costPrice ?? null,
    notes: notes ?? null,
  })

  if (type === 'in' && costPrice != null) {
    const { data: product } = await supabase
      .from('products')
      .select('cost_price')
      .eq('id', productId)
      .single()

    const prevPrice = product?.cost_price

    await supabase.from('products').update({ cost_price: costPrice }).eq('id', productId)
    await supabase.from('price_history').insert({ product_id: productId, cost_price: costPrice })

    if (prevPrice != null && prevPrice > 0) {
      const changeRate = (costPrice - prevPrice) / prevPrice
      if (changeRate >= 0.05) {
        await supabase.from('price_alerts').insert({
          product_id: productId,
          previous_price: prevPrice,
          new_price: costPrice,
          change_rate: changeRate,
        })
      }
    }
  }

  revalidatePath('/admin/stock')
  revalidatePath('/admin')
  return { newQuantity }
}

export async function updateMinQuantity(productId: string, minQuantity: number) {
  const supabase = await createServiceClient()
  await supabase.from('stock').upsert(
    { product_id: productId, min_quantity: minQuantity },
    { onConflict: 'product_id' },
  )
  revalidatePath('/admin/stock')
}
