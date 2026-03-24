import { createServiceClient } from '@/lib/supabase/server'
import { HistoryClient } from '@/components/admin/stock/HistoryClient'

export default async function StockHistoryPage() {
  const supabase = await createServiceClient()

  // 過去 6ヶ月分を取得
  const since = new Date()
  since.setMonth(since.getMonth() - 6)

  const { data: transactions } = await supabase
    .from('stock_transactions')
    .select(`
      id, type, quantity, cost_price, notes, created_at,
      products(name, name_en, unit)
    `)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  const rows = (transactions ?? []).map(t => {
    const p = t.products as unknown as { name: string; name_en: string; unit: string } | null
    return {
      id:           t.id,
      type:         t.type as 'in' | 'out' | 'adjustment',
      quantity:     Number(t.quantity),
      cost_price:   t.cost_price != null ? Number(t.cost_price) : null,
      notes:        t.notes,
      created_at:   t.created_at,
      product_name:    p?.name    ?? '—',
      product_name_en: p?.name_en ?? '',
      unit:            p?.unit    ?? '',
    }
  })

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>入出庫履歴</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>過去 6ヶ月間の入出庫記録</p>
      </div>
      <HistoryClient transactions={rows} />
    </div>
  )
}
