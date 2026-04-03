import { createServiceClient } from '@/lib/supabase/server'
import { MenuClient } from '@/components/menu/MenuClient'

// ja / en を静的生成 → 30秒 ISR
export const revalidate = 30

export function generateStaticParams() {
  return [{ locale: 'ja' }, { locale: 'en' }]
}

export default async function MenuPage() {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [
    { data: products, error },
    { data: cocktailsRaw },
    { data: glassesRaw },
  ] = await Promise.all([
    supabase
      .from('products')
      .select(`
        id, name, name_en, selling_price, image_url,
        tags, is_available, display_out_of_stock,
        is_recommended, custom_tag, category_id,
        categories(name, name_en),
        stock(quantity),
        wine_details(wine_type),
        spirits_details(shot_price, type, volume_ml)
      `)
      .order('is_recommended', { ascending: false })
      .order('name'),

    supabase
      .from('cocktails')
      .select('id, name, name_en, selling_price, tags, description, is_available, sort_order')
      .eq('is_available', true)
      .order('sort_order'),

    sb
      .from('glasses')
      .select(`
        id, serving_ml, selling_price,
        products!inner(name, name_en, wine_details(wine_type, country, vintage, grape_varieties))
      `)
      .eq('is_available', true)
      .order('opened_at', { ascending: false }),
  ])

  if (error) console.error('[MenuPage] Supabase error:', error.message)

  function resolveOne<T>(raw: unknown): T | null {
    if (!raw) return null
    return (Array.isArray(raw) ? raw[0] : raw) as T
  }

  // ── 商品リスト
  // ・is_available=false (メニューに表示 OFF) → 常に非表示
  // ・is_available=true  + 在庫0 + display_out_of_stock=false (入荷待ち表示 OFF) → 非表示
  // ・is_available=true  + 在庫0 + display_out_of_stock=true  (入荷待ち表示 ON)  → 「入荷待ち」表示
  // ・is_available=true  + 在庫1以上 → 通常表示
  const rows = (products ?? [])
    .filter(p => {
      if (!p.is_available) return false
      const qty = Number(resolveOne<{ quantity: number }>(p.stock)?.quantity ?? 0)
      return qty > 0 || p.display_out_of_stock
    })
    .map(p => {
      const qty   = Number(resolveOne<{ quantity: number }>(p.stock)?.quantity ?? 0)
      const wd    = resolveOne<{ wine_type: string }>(p.wine_details)
      const sd    = resolveOne<{ shot_price: number | null; type: string; volume_ml: number | null }>(p.spirits_details)
      const is_waiting = qty === 0
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
        wine_type:        wd?.wine_type ?? null,
        shot_price:       sd?.shot_price ?? null,
        spirits_type:     sd?.type       ?? null,
        volume_ml:        sd?.volume_ml  ?? null,
      }
    })

  // ── カクテル
  const cocktails = (cocktailsRaw ?? []).map((c: {
    id: string; name: string; name_en: string; selling_price: number | null
    tags: string[]; description: string; is_available: boolean; sort_order: number
  }) => ({
    id:            c.id,
    name:          c.name,
    name_en:       c.name_en ?? '',
    selling_price: c.selling_price,
    tags:          c.tags ?? [],
    description:   c.description ?? '',
  }))

  // ── グラスワイン
  const glassWines = (glassesRaw ?? []).map((g: {
    id: string; serving_ml: number; selling_price: number | null
    products: { name: string; name_en: string; wine_details: unknown }
  }) => {
    const p  = g.products
    const wd = resolveOne<{ wine_type: string; country: string; vintage: number | null; grape_varieties: string[] }>(p.wine_details)
    return {
      id:            g.id,
      name:          p.name,
      name_en:       p.name_en ?? '',
      serving_ml:    g.serving_ml,
      selling_price: g.selling_price,
      wine_type:     wd?.wine_type   ?? null,
      country:       wd?.country     ?? null,
      vintage:       wd?.vintage     ?? null,
      grape:         wd?.grape_varieties?.[0] ?? null,
    }
  })

  return <MenuClient products={rows} cocktails={cocktails} glassWines={glassWines} />
}
