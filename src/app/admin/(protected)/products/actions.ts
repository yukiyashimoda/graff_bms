'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidateProducts, revalidateOrders } from '@/lib/revalidate'
import { revalidatePath } from 'next/cache'

// ─── 画像アップロード ────────────────────────────────────────────────────────

async function uploadImage(file: File): Promise<string | null> {
  const supabase = await createServiceClient()
  const ext  = file.name.split('.').pop()
  const path = `products/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from(process.env.STORAGE_BUCKET!)
    .upload(path, file)
  if (error) return null
  return supabase.storage.from(process.env.STORAGE_BUCKET!).getPublicUrl(path).data.publicUrl
}

// ─── FormData パース ─────────────────────────────────────────────────────────

function parseProductFields(formData: FormData) {
  const str  = (key: string) => (formData.get(key) as string) || null
  const bool = (key: string) => formData.get(key) === 'true'
  return {
    name:                 (formData.get('name') as string).trim(),
    name_en:              str('name_en')              ?? '',
    category_id:          str('category_id'),
    supplier_id:          str('supplier_id'),
    default_supplier_id:  str('default_supplier_id'),
    unit:                 str('unit')                 ?? '本',
    cost_price:           formData.get('cost_price')    ? parseFloat(formData.get('cost_price') as string)    : null,
    selling_price:        formData.get('selling_price') ? parseFloat(formData.get('selling_price') as string) : null,
    tags:                 formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean) : [],
    notes:                str('notes'),
    is_available:         bool('is_available'),
    is_recommended:       bool('is_recommended'),
    custom_tag:           str('custom_tag'),
    display_out_of_stock: bool('display_out_of_stock'),
  }
}

// ─── 詳細テーブルへの insert（カテゴリ別） ───────────────────────────────────

async function insertDetailRecord(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  productId: string,
  detailType: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const str = (key: string) => (formData.get(key) as string) || ''
  const int = (key: string) => formData.get(key) ? parseInt(formData.get(key) as string) : null
  const flt = (key: string) => formData.get(key) ? parseFloat(formData.get(key) as string) : null

  if (detailType === 'wine') {
    const grapeRaw = formData.get('wine_grape_varieties') as string
    const { error } = await supabase.from('wine_details').insert({
      product_id:      productId,
      country:         str('wine_country'),
      region:          str('wine_region'),
      region_en:       str('wine_region_en'),
      grape_varieties: grapeRaw ? grapeRaw.split(',').map(g => g.trim()).filter(Boolean) : [],
      wine_type:       (str('wine_type') || 'other') as 'white' | 'red' | 'rosé' | 'sparkling' | 'champagne' | 'other',
      body:            (str('wine_body') || null) as 'light' | 'medium' | 'full' | null,
      vintage:         int('wine_vintage'),
      description:     str('wine_description'),
      description_en:  str('wine_description_en'),
    })
    if (error) return { error: `ワイン詳細の保存に失敗: ${error.message}` }
  }

  if (detailType === 'spirits') {
    const { error } = await supabase.from('spirits_details').insert({
      product_id:    productId,
      type:          str('spirits_type'),
      volume_ml:     int('spirits_volume_ml'),
      shot_price:    flt('spirits_shot_price'),
      age_statement: str('spirits_age_statement') || null,
    })
    if (error) return { error: `スピリッツ詳細の保存に失敗: ${error.message}` }
  }

  if (detailType === 'soft_drink') {
    const { error } = await supabase.from('soft_drink_details').insert({
      product_id: productId,
      volume_ml:  int('soft_drink_volume_ml'),
      is_mixer:   formData.get('soft_drink_is_mixer') === 'true',
    })
    if (error) return { error: `ソフトドリンク詳細の保存に失敗: ${error.message}` }
  }

  return {}
}

// ─── Public Actions ──────────────────────────────────────────────────────────

export async function createProduct(formData: FormData) {
  const fields     = parseProductFields(formData)
  const detail_type = formData.get('detail_type') as string
  const imageFile   = formData.get('image') as File | null

  if (!fields.name) redirect('/admin/products/new?error=name_required')

  const supabase = await createServiceClient()

  const image_url = imageFile && imageFile.size > 0 ? await uploadImage(imageFile) : null

  const { data: product, error } = await supabase
    .from('products')
    .insert({ ...fields, image_url })
    .select('id')
    .single()

  if (error || !product) {
    console.error('[createProduct]', error)
    redirect('/admin/products/new?error=create_failed')
  }

  const detailResult = await insertDetailRecord(supabase, product.id, detail_type, formData)
  if (detailResult.error) {
    // ロールバック: 作成した商品を削除してエラーページへ
    await supabase.from('products').delete().eq('id', product.id)
    console.error('[createProduct] detail insert failed:', detailResult.error)
    redirect('/admin/products/new?error=detail_failed')
  }

  revalidateProducts()
  redirect('/admin/products')
}

export async function updateProduct(id: string, formData: FormData) {
  const fields    = parseProductFields(formData)
  const imageFile = formData.get('image') as File | null

  if (!fields.name) redirect(`/admin/products/${id}/edit?error=name_required`)

  const supabase  = await createServiceClient()
  const image_url = imageFile && imageFile.size > 0 ? await uploadImage(imageFile) : null

  const patch = { ...fields, ...(image_url ? { image_url } : {}) }
  const { error } = await supabase.from('products').update(patch).eq('id', id)

  if (error) {
    console.error('[updateProduct]', error)
    redirect(`/admin/products/${id}/edit?error=update_failed`)
  }

  revalidateProducts()
  redirect('/admin/products')
}

export async function deleteProduct(id: string) {
  const supabase = await createServiceClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) console.error('[deleteProduct]', error)
  revalidateProducts()
}

export async function updateProductAvailability(id: string, is_available: boolean) {
  const supabase = await createServiceClient()
  await supabase.from('products').update({ is_available }).eq('id', id)
  revalidateProducts()
}

export async function updateDisplayOutOfStock(id: string, display_out_of_stock: boolean) {
  const supabase = await createServiceClient()
  await supabase.from('products').update({ display_out_of_stock }).eq('id', id)
  revalidateProducts()
}

// ─── 価格一括更新 ────────────────────────────────────────────────────────────

async function bulkUpdate(
  table: string,
  idCol: string,
  priceCol: string,
  items: { id: string; [key: string]: number | null | string }[],
): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  const results  = await Promise.allSettled(
    items.map(item =>
      supabase.from(table as 'products').update({ [priceCol]: item[priceCol] } as Record<string, unknown>).eq(idCol, item.id)
    )
  )
  const failed = results.filter(r => r.status === 'rejected')
  if (failed.length > 0) return { error: `${failed.length}件の更新に失敗しました` }
  return {}
}

export async function bulkUpdateSellingPrices(items: { id: string; selling_price: number | null }[]) {
  await bulkUpdate('products', 'id', 'selling_price', items)
  revalidateProducts()
  revalidatePath('/admin/pricing')
}

export async function bulkUpdateGlassPrices(items: { id: string; selling_price: number | null }[]) {
  const supabase = await createServiceClient()
  await Promise.allSettled(
    items.map(({ id, selling_price }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('glasses').update({ selling_price }).eq('id', id)
    )
  )
  revalidateProducts()
  revalidatePath('/admin/pricing')
}

export async function bulkUpdateCocktailPrices(items: { id: string; selling_price: number | null }[]) {
  const supabase = await createServiceClient()
  await Promise.allSettled(
    items.map(({ id, selling_price }) =>
      supabase.from('cocktails').update({ selling_price }).eq('id', id)
    )
  )
  revalidateProducts()
  revalidatePath('/admin/pricing')
}

export async function bulkUpdateShotPrices(items: { id: string; shot_price: number | null }[]) {
  const supabase = await createServiceClient()
  await Promise.allSettled(
    items.map(({ id, shot_price }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('spirits_details').update({ shot_price }).eq('product_id', id)
    )
  )
  revalidateProducts()
  revalidatePath('/admin/pricing')
}

// 未使用だが型参照のため
void revalidateOrders
