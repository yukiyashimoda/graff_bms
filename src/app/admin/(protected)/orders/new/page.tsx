import { createServiceClient } from '@/lib/supabase/server'
import { OrderForm } from '@/components/admin/orders/OrderForm'

export default async function NewOrderPage() {
  const supabase = await createServiceClient()

  const [{ data: suppliers }, { data: products }] = await Promise.all([
    supabase.from('suppliers').select('id, name').order('name'),
    supabase.from('products').select('id, name, unit, cost_price').eq('is_available', true).order('name'),
  ])

  return (
    <OrderForm
      suppliers={suppliers ?? []}
      products={products ?? []}
    />
  )
}
