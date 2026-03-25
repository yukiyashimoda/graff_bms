'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import type { CocktailRow } from '@/components/admin/products/CocktailsClient'

type CocktailData = Omit<CocktailRow, 'id' | 'sort_order' | 'total_cost' | 'cost_rate_pct'>

export async function createCocktail(data: CocktailData): Promise<{ data?: CocktailRow; error?: string }> {
  const supabase = await createServiceClient()
  const { data: row, error } = await supabase
    .from('cocktails')
    .insert(data)
    .select('id, name, name_en, description, selling_price, image_url, tags, is_available, sort_order')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  revalidatePath('/ja', 'page')
  revalidatePath('/en', 'page')
  return { data: { ...row, total_cost: null, cost_rate_pct: null } as CocktailRow }
}

export async function updateCocktail(id: string, data: CocktailData): Promise<{ data?: Partial<CocktailRow>; error?: string }> {
  const supabase = await createServiceClient()
  const { data: row, error } = await supabase
    .from('cocktails')
    .update(data)
    .eq('id', id)
    .select('id, name, name_en, description, selling_price, image_url, tags, is_available, sort_order')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  revalidatePath('/ja', 'page')
  revalidatePath('/en', 'page')
  return { data: row as Partial<CocktailRow> }
}

export async function deleteCocktail(id: string): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  const { error } = await supabase.from('cocktails').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  revalidatePath('/ja', 'page')
  revalidatePath('/en', 'page')
  return {}
}

export async function toggleCocktailAvailability(id: string, is_available: boolean): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  const { error } = await supabase.from('cocktails').update({ is_available }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  revalidatePath('/ja', 'page')
  revalidatePath('/en', 'page')
  return {}
}
