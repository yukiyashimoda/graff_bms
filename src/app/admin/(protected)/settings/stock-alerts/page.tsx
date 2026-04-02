import { createServiceClient } from '@/lib/supabase/server'
import { StockAlertsClient } from '@/components/admin/settings/StockAlertsClient'

export default async function StockAlertsPage() {
  const supabase = await createServiceClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, unit, stock(quantity, min_quantity)')
    .order('name')

  const rows = (products ?? []).map(p => {
    const s = Array.isArray(p.stock) ? p.stock[0] : p.stock
    return {
      id:           p.id,
      name:         p.name,
      unit:         p.unit ?? '本',
      min_quantity: s?.min_quantity ?? 0,
    }
  })

  return <StockAlertsClient rows={rows} />
}
