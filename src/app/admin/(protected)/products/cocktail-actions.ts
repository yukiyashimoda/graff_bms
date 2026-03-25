'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

type BasicData = {
  name:          string
  name_en:       string
  description:   string
  selling_price: number | null
  tags:          string[]
  is_available:  boolean
  recipe_steps:  string[]
}

type IngredientInput = {
  product_id: string
  quantity:   number
  unit:       string
}

function revalidateAll() {
  revalidatePath('/admin/products')
  revalidatePath('/ja', 'page')
  revalidatePath('/en', 'page')
}

export async function createCocktailWithIngredients(
  basic: BasicData,
  ingredients: IngredientInput[],
): Promise<{ data?: { id: string }; error?: string }> {
  const supabase = await createServiceClient()

  const { data: cocktail, error } = await supabase
    .from('cocktails')
    .insert(basic)
    .select('id')
    .single()

  if (error || !cocktail) return { error: error?.message ?? '作成に失敗しました' }

  if (ingredients.length > 0) {
    const { error: ingErr } = await supabase
      .from('cocktail_ingredients')
      .insert(ingredients.map(i => ({ ...i, cocktail_id: cocktail.id })))

    if (ingErr) {
      await supabase.from('cocktails').delete().eq('id', cocktail.id)
      return { error: ingErr.message }
    }
  }

  revalidateAll()
  return { data: { id: cocktail.id } }
}

export async function updateCocktailBasicInfo(
  id: string,
  data: BasicData,
): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  const { error } = await supabase.from('cocktails').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

export async function replaceIngredients(
  cocktailId: string,
  ingredients: IngredientInput[],
): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  const { error: delErr } = await supabase
    .from('cocktail_ingredients').delete().eq('cocktail_id', cocktailId)
  if (delErr) return { error: delErr.message }

  if (ingredients.length > 0) {
    const { error: insErr } = await supabase
      .from('cocktail_ingredients')
      .insert(ingredients.map(i => ({ ...i, cocktail_id: cocktailId })))
    if (insErr) return { error: insErr.message }
  }

  revalidatePath('/admin/products')
  return {}
}

export async function deleteCocktail(id: string): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  const { error } = await supabase.from('cocktails').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

export async function toggleCocktailAvailability(
  id: string,
  is_available: boolean,
): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  const { error } = await supabase.from('cocktails').update({ is_available }).eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

export async function verifyRecipePassword(
  password: string,
): Promise<{ ok: boolean }> {
  const expected = process.env.COCKTAIL_RECIPE_PASSWORD
  return { ok: !!expected && password === expected }
}
