'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import type { GlassRow } from '@/components/admin/products/GlassesClient'

type GlassData = {
  product_id:    string
  serving_ml:    number
  bottle_ml:     number | null
  selling_price: number | null
  opened_at:     string
  is_available:  boolean
}

export async function createGlass(data: GlassData): Promise<{ data?: GlassRow; error?: string }> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // 1. グラスレコード登録
  const { data: row, error } = await sb
    .from('glasses')
    .insert(data)
    .select(`
      id, product_id, serving_ml, bottle_ml, selling_price, opened_at, is_available,
      products!inner(name, name_en, cost_price, categories(name))
    `)
    .single()

  if (error) return { error: error.message }

  // 2. 在庫から1本マイナス（開栓記録）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc('process_stock_transaction', {
    p_product_id: data.product_id,
    p_type:       'out',
    p_quantity:   1,
    p_cost_price: null,
    p_notes:      'グラス提供用開栓',
  })

  revalidatePath('/admin/products')
  revalidatePath('/admin/stock')

  const p = row.products
  return {
    data: {
      id:              row.id,
      product_id:      row.product_id,
      product_name:    p.name,
      product_name_en: p.name_en,
      cost_price:      p.cost_price,
      serving_ml:      row.serving_ml,
      bottle_ml:       row.bottle_ml,
      selling_price:   row.selling_price,
      opened_at:       row.opened_at,
      is_available:    row.is_available,
      category_name:   p.categories?.name ?? null,
    } as GlassRow,
  }
}

export async function deleteGlass(id: string): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('glasses').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return {}
}

type UpdateData = {
  serving_ml:    number
  bottle_ml:     number | null
  selling_price: number | null
  opened_at:     string
}

export async function updateGlass(id: string, data: UpdateData): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('glasses').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return {}
}

export async function stockOutGlass(productId: string): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  const { error } = await (supabase as any).rpc('process_stock_transaction', {
    p_product_id: productId,
    p_type:       'out',
    p_quantity:   1,
    p_cost_price: null,
    p_notes:      'グラス追加出庫',
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  revalidatePath('/admin/stock')
  return {}
}

export async function toggleGlassAvailability(id: string, is_available: boolean): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('glasses')
    .update({ is_available })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return {}
}
