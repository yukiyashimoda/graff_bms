'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import type { GlassRow } from '@/components/admin/products/GlassesClient'

type GlassData = Omit<GlassRow, 'id' | 'sort_order'>

export async function createGlass(data: GlassData): Promise<{ data?: GlassRow; error?: string }> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await (supabase as any)
    .from('glasses')
    .insert(data)
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { data: row as GlassRow }
}

export async function updateGlass(id: string, data: GlassData): Promise<{ data?: GlassRow; error?: string }> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await (supabase as any)
    .from('glasses')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { data: row as GlassRow }
}

export async function deleteGlass(id: string): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('glasses').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
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
