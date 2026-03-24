import { createServiceClient } from '@/lib/supabase/server'
import { AlertsClient } from '@/components/admin/alerts/AlertsClient'

export default async function AlertsPage() {
  const supabase = await createServiceClient()

  const { data: alerts } = await supabase
    .from('price_alerts')
    .select(`
      id, previous_price, new_price, change_rate, is_read, created_at,
      products(name, name_en, unit)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = (alerts ?? []).map(a => {
    const p = a.products as unknown as { name: string; name_en: string; unit: string } | null
    return {
      id:             a.id,
      previous_price: Number(a.previous_price),
      new_price:      Number(a.new_price),
      change_rate:    Number(a.change_rate),
      is_read:        a.is_read,
      created_at:     a.created_at,
      product_name:   p?.name    ?? '—',
      product_name_en: p?.name_en ?? '',
      unit:           p?.unit    ?? '',
    }
  })

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>価格アラート</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          前回仕入れ価格から 5% 以上上昇した商品
        </p>
      </div>
      <AlertsClient alerts={rows} />
    </div>
  )
}
