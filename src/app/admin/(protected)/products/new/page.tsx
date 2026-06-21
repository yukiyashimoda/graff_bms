import { createServiceClient } from '@/lib/supabase/server'
import ProductForm from '@/components/admin/products/ProductForm'

const ERROR_MESSAGES: Record<string, string> = {
  name_required: '商品名を入力してください。',
  create_failed: '商品登録に失敗しました。入力内容を確認してください。',
  detail_failed: '商品登録は完了しましたが、詳細情報の保存に失敗しました。',
}

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createServiceClient()

  const [{ data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from('categories').select('id, name, name_en').order('sort_order'),
    supabase.from('suppliers').select('id, name').order('name'),
  ])

  return (
    <ProductForm
      categories={categories ?? []}
      suppliers={suppliers ?? []}
      errorMessage={error ? (ERROR_MESSAGES[error] ?? '商品登録に失敗しました。') : null}
    />
  )
}
