import { createServiceClient } from '@/lib/supabase/server'
import { PricingClient } from '@/components/admin/pricing/PricingClient'

export default async function PricingPage() {
  const supabase = await createServiceClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, name_en, cost_price, selling_price, categories(name), spirits_details(shot_price, volume_ml)')
    .order('categories(name)', { ascending: true })

  const rows = (products ?? []).map(p => {
    const sd = (p.spirits_details as unknown as { shot_price: number | null; volume_ml: number | null }[] | null)
    const spirits = Array.isArray(sd) ? (sd[0] ?? null) : sd
    return {
      id:            p.id,
      name:          p.name,
      name_en:       p.name_en ?? '',
      cost_price:    p.cost_price,
      selling_price: p.selling_price,
      category_name: (p.categories as unknown as { name: string } | null)?.name ?? null,
      shot_price:    spirits?.shot_price ?? null,
      volume_ml:     spirits?.volume_ml ?? null,
      is_spirits:    spirits !== null,
    }
  })

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>原価計算</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          販売価格をまとめて設定して原価率を確認できます
        </p>
      </div>
      <PricingClient products={rows} />
    </div>
  )
}
