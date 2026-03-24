'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'

export async function createProduct(formData: FormData) {
  const supabase = await createServiceClient()

  const name                 = formData.get('name')                as string
  const name_en              = formData.get('name_en')             as string
  const category_id          = formData.get('category_id')         as string | null
  const supplier_id          = formData.get('supplier_id')         as string | null
  const unit                 = formData.get('unit')                as string
  const cost_price           = formData.get('cost_price')          as string
  const selling_price        = formData.get('selling_price')       as string
  const tags                 = formData.get('tags')                as string
  const notes                = formData.get('notes')               as string
  const is_available         = formData.get('is_available') === 'true'
  const imageFile            = formData.get('image')               as File | null
  const is_recommended       = formData.get('is_recommended')      === 'true'
  const custom_tag           = formData.get('custom_tag')          as string | null
  const display_out_of_stock = formData.get('display_out_of_stock') === 'true'
  const default_supplier_id  = formData.get('default_supplier_id') as string | null
  const detail_type          = formData.get('detail_type')         as string

  let image_url: string | null = null

  // 画像アップロード
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop()
    const path = `products/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, imageFile)

    if (!uploadError) {
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      image_url = data.publicUrl
    }
  }

  const { data: product, error } = await supabase.from('products').insert({
    name,
    name_en:              name_en       || '',
    category_id:          category_id   || null,
    supplier_id:          supplier_id   || null,
    unit:                 unit          || '本',
    cost_price:           cost_price    ? parseFloat(cost_price)    : null,
    selling_price:        selling_price ? parseFloat(selling_price) : null,
    tags:                 tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    notes:                notes || null,
    is_available,
    image_url,
    is_recommended,
    custom_tag:           custom_tag           || null,
    display_out_of_stock,
    default_supplier_id:  default_supplier_id  || null,
  }).select('id').single()

  if (error || !product) {
    console.error(error)
    redirect('/admin/products/new?error=1')
  }

  // カテゴリ別詳細テーブルへの insert
  if (detail_type === 'wine') {
    const grape_varieties = formData.get('wine_grape_varieties') as string
    await supabase.from('wine_details').insert({
      product_id:      product.id,
      country:         (formData.get('wine_country')      as string) || '',
      region:          (formData.get('wine_region')       as string) || '',
      region_en:       (formData.get('wine_region_en')    as string) || '',
      grape_varieties: grape_varieties
        ? grape_varieties.split(',').map(g => g.trim()).filter(Boolean)
        : [],
      wine_type: (formData.get('wine_type') as string) || 'other',
      body:      (formData.get('wine_body') as 'light' | 'medium' | 'full') || null,
      vintage: formData.get('wine_vintage')
        ? parseInt(formData.get('wine_vintage') as string)
        : null,
      description:    (formData.get('wine_description')    as string) || '',
      description_en: (formData.get('wine_description_en') as string) || '',
    })
  } else if (detail_type === 'spirits') {
    await supabase.from('spirits_details').insert({
      product_id:    product.id,
      type:          (formData.get('spirits_type')          as string) || '',
      volume_ml:     formData.get('spirits_volume_ml')
        ? parseInt(formData.get('spirits_volume_ml') as string)
        : null,
      shot_price:    formData.get('spirits_shot_price')
        ? parseFloat(formData.get('spirits_shot_price') as string)
        : null,
      age_statement: (formData.get('spirits_age_statement') as string) || null,
    })
  } else if (detail_type === 'soft_drink') {
    await supabase.from('soft_drink_details').insert({
      product_id: product.id,
      volume_ml:  formData.get('soft_drink_volume_ml')
        ? parseInt(formData.get('soft_drink_volume_ml') as string)
        : null,
      is_mixer: formData.get('soft_drink_is_mixer') === 'true',
    })
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function updateProductAvailability(id: string, is_available: boolean) {
  const supabase = await createServiceClient()
  await supabase.from('products').update({ is_available }).eq('id', id)
  revalidatePath('/admin/products')
}

export async function updateDisplayOutOfStock(id: string, display_out_of_stock: boolean) {
  const supabase = await createServiceClient()
  await supabase.from('products').update({ display_out_of_stock }).eq('id', id)
  revalidatePath('/admin/products')
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createServiceClient()

  const name                 = formData.get('name')                as string
  const name_en              = formData.get('name_en')             as string
  const category_id          = formData.get('category_id')         as string | null
  const supplier_id          = formData.get('supplier_id')         as string | null
  const unit                 = formData.get('unit')                as string
  const cost_price           = formData.get('cost_price')          as string
  const selling_price        = formData.get('selling_price')       as string
  const tags                 = formData.get('tags')                as string
  const notes                = formData.get('notes')               as string
  const is_available         = formData.get('is_available') === 'true'
  const imageFile            = formData.get('image')               as File | null
  const is_recommended       = formData.get('is_recommended')      === 'true'
  const custom_tag           = formData.get('custom_tag')          as string | null
  const display_out_of_stock = formData.get('display_out_of_stock') === 'true'
  const default_supplier_id  = formData.get('default_supplier_id') as string | null

  let image_url: string | null = null

  if (imageFile && imageFile.size > 0) {
    const ext  = imageFile.name.split('.').pop()
    const path = `products/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, imageFile)
    if (!uploadError) {
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      image_url = data.publicUrl
    }
  }

  const update: Record<string, unknown> = {
    name,
    name_en:              name_en       || '',
    category_id:          category_id   || null,
    supplier_id:          supplier_id   || null,
    unit:                 unit          || '本',
    cost_price:           cost_price    ? parseFloat(cost_price)    : null,
    selling_price:        selling_price ? parseFloat(selling_price) : null,
    tags:                 tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    notes:                notes || null,
    is_available,
    is_recommended,
    custom_tag:           custom_tag          || null,
    display_out_of_stock,
    default_supplier_id:  default_supplier_id || null,
  }
  if (image_url) update.image_url = image_url

  await supabase.from('products').update(update).eq('id', id)

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function deleteProduct(id: string) {
  const supabase = await createServiceClient()
  await supabase.from('products').delete().eq('id', id)
  revalidatePath('/admin/products')
}

export async function bulkUpdateSellingPrices(
  items: { id: string; selling_price: number | null }[]
) {
  const supabase = await createServiceClient()
  await Promise.all(
    items.map(({ id, selling_price }) =>
      supabase.from('products').update({ selling_price }).eq('id', id)
    )
  )
  revalidatePath('/admin/products')
  revalidatePath('/admin/pricing')
}
