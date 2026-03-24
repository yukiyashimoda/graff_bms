import { createServiceClient } from '@/lib/supabase/server'
import { MenuClient } from '@/components/menu/MenuClient'

// ja / en を静的生成 → 30秒 ISR
export const revalidate = 30

export function generateStaticParams() {
  return [{ locale: 'ja' }, { locale: 'en' }]
}

export default async function MenuPage() {
  const supabase = await createServiceClient()

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id, name, name_en, selling_price, image_url,
      tags, is_available, display_out_of_stock,
      is_recommended, custom_tag, category_id,
      categories(name, name_en),
      stock(quantity),
      wine_details(wine_type)
    `)
    .order('is_recommended', { ascending: false })
    .order('name')

  if (error) console.error('[MenuPage] Supabase error:', error.message)

  function resolveQty(raw: unknown): number {
    if (!raw) return 0
    const obj = Array.isArray(raw) ? raw[0] : raw
    return Number((obj as { quantity?: number })?.quantity ?? 0)
  }

  const rows = (products ?? [])
    .filter(p => {
      if (!p.display_out_of_stock) return false  // 目のアイコンOFF → 非表示
      if (!p.is_available) return true           // 入荷待ち → 表示
      return resolveQty(p.stock) > 0             // 提供中は在庫あるときのみ表示
    })
    .map(p => {
      const is_waiting = !p.is_available
      return {
        id:               p.id,
        name:             p.name,
        name_en:          p.name_en ?? '',
        selling_price:    p.selling_price,
        image_url:        p.image_url,
        tags:             p.tags ?? [],
        is_waiting,
        is_recommended:   p.is_recommended && !is_waiting,
        custom_tag:       p.custom_tag,
        category_id:      p.category_id,
        category_name:    (p.categories as unknown as { name: string; name_en: string } | null)?.name    ?? null,
        category_name_en: (p.categories as unknown as { name: string; name_en: string } | null)?.name_en ?? null,
        wine_type: (() => {
          const wd = p.wine_details
          const obj = Array.isArray(wd) ? wd[0] : wd
          return (obj as { wine_type?: string } | null)?.wine_type ?? null
        })(),
      }
    })

  return <MenuClient products={rows} />
}
