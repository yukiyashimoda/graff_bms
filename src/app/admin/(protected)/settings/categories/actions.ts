'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export type Category = {
  id:         string
  name:       string
  name_en:    string | null
  parent_id:  string | null
  sort_order: number
  created_at: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sb() { return (await createServiceClient()) as any }

export async function getCategories(): Promise<Category[]> {
  const supabase = await sb()
  const { data } = await supabase
    .from('categories')
    .select('id, name, name_en, parent_id, sort_order, created_at')
    .order('sort_order')
  return data ?? []
}

export async function createParentCategory(name: string): Promise<void> {
  const supabase = await sb()
  const { data: last } = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  await supabase.from('categories').insert({
    name,
    name_en:    null,
    parent_id:  null,
    sort_order: (last?.sort_order ?? 0) + 1,
  })
  revalidatePath('/admin/settings/categories')
  revalidatePath('/admin/products')
}

export async function createSubCategory(name: string, parentId: string): Promise<void> {
  const supabase = await sb()
  const { data: last } = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  await supabase.from('categories').insert({
    name,
    name_en:    null,
    parent_id:  parentId,
    sort_order: (last?.sort_order ?? 0) + 1,
  })
  revalidatePath('/admin/settings/categories')
  revalidatePath('/admin/products')
}

export async function deleteSubCategory(id: string): Promise<void> {
  const supabase = await sb()
  await supabase.from('products').update({ category_id: null }).eq('category_id', id)
  await supabase.from('categories').delete().eq('id', id)
  revalidatePath('/admin/settings/categories')
  revalidatePath('/admin/products')
}

export async function deleteParentCategory(id: string): Promise<void> {
  const supabase = await sb()
  // 子カテゴリのIDを取得
  const { data: subs } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', id)
  // 子カテゴリに紐づく商品のcategory_idをクリア
  for (const sub of subs ?? []) {
    await supabase.from('products').update({ category_id: null }).eq('category_id', sub.id)
  }
  // 親カテゴリに直接紐づく商品のcategory_idをクリア
  await supabase.from('products').update({ category_id: null }).eq('category_id', id)
  // 子カテゴリを削除してから親を削除
  await supabase.from('categories').delete().eq('parent_id', id)
  await supabase.from('categories').delete().eq('id', id)
  revalidatePath('/admin/settings/categories')
  revalidatePath('/admin/products')
}
