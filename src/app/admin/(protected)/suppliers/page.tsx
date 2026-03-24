import { createServiceClient } from '@/lib/supabase/server'
import { SupplierManager } from '@/components/admin/suppliers/SupplierManager'

export default async function SuppliersPage() {
  const supabase = await createServiceClient()

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .order('name')

  return <SupplierManager suppliers={suppliers ?? []} />
}
