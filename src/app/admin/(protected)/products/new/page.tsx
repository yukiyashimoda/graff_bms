import { createServiceClient } from '@/lib/supabase/server'
import ProductForm from '@/components/admin/products/ProductForm'

export default async function NewProductPage() {
  const supabase = await createServiceClient()

  const [{ data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from('categories').select('id, name, name_en').order('sort_order'),
    supabase.from('suppliers').select('id, name').order('name'),
  ])

  return (
    <ProductForm
      categories={categories ?? []}
      suppliers={suppliers ?? []}
    />
  )
}
