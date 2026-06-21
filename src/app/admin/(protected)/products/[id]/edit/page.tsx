import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import ProductForm from '@/components/admin/products/ProductForm'

type Props = { params: Promise<{ id: string }> }

const ERROR_MESSAGES: Record<string, string> = {
  name_required: '商品名を入力してください。',
  update_failed: '商品更新に失敗しました。入力内容を確認してください。',
}

export default async function EditProductPage({
  params,
  searchParams,
}: Props & { searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createServiceClient()

  const [{ data: product }, { data: categories }, { data: suppliers }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, name_en, category_id, supplier_id, default_supplier_id, unit, cost_price, selling_price, tags, notes, is_available, is_recommended, custom_tag, display_out_of_stock, image_url')
      .eq('id', id)
      .single(),
    supabase.from('categories').select('id, name, name_en').order('sort_order'),
    supabase.from('suppliers').select('id, name').order('name'),
  ])

  if (!product) notFound()

  return (
    <ProductForm
      productId={product.id}
      initialData={{
        name:                 product.name,
        name_en:              product.name_en ?? '',
        category_id:          product.category_id,
        supplier_id:          product.supplier_id,
        default_supplier_id:  product.default_supplier_id,
        unit:                 product.unit,
        cost_price:           product.cost_price,
        selling_price:        product.selling_price,
        tags:                 product.tags ?? [],
        notes:                product.notes,
        is_available:         product.is_available,
        is_recommended:       product.is_recommended,
        custom_tag:           product.custom_tag,
        display_out_of_stock: product.display_out_of_stock,
        image_url:            product.image_url,
      }}
      categories={categories ?? []}
      suppliers={suppliers ?? []}
      errorMessage={error ? (ERROR_MESSAGES[error] ?? '商品更新に失敗しました。') : null}
    />
  )
}
