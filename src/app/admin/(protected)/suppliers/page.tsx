import { createServiceClient } from '@/lib/supabase/server'
import { SupplierManager } from '@/components/admin/suppliers/SupplierManager'

export default async function SuppliersPage() {
  const supabase = await createServiceClient()

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, name_en, contact_name, phone, address, notes')
    .order('name')

  return <SupplierManager suppliers={suppliers ?? []} />
}
