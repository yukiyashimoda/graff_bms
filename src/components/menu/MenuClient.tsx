'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { RiSearchLine } from 'react-icons/ri'
import { createClient } from '@/lib/supabase/client'
import { TranslateWidget } from './TranslateWidget'

type WineType = 'white' | 'red' | 'rosé' | 'sparkling' | 'champagne' | 'other'

const WINE_TYPE_ORDER: WineType[] = ['white', 'red', 'rosé', 'sparkling', 'champagne', 'other']
const WINE_TYPE_LABEL: Record<WineType, string> = {
  white:      'WHITE WINE',
  red:        'RED WINE',
  rosé:       'ROSÉ',
  sparkling:  'SPARKLING',
  champagne:  'CHAMPAGNE',
  other:      'WINE',
}

type Product = {
  id:               string
  name:             string
  name_en:          string
  selling_price:    number | null
  image_url:        string | null
  tags:             string[]
  is_waiting:       boolean
  is_recommended:   boolean
  custom_tag:       string | null
  category_id:      string | null
  category_name:    string | null
  category_name_en: string | null
  wine_type:        string | null
  shot_price:       number | null
  spirits_type:     string | null
  volume_ml:        number | null
}

type Cocktail = {
  id:            string
  name:          string
  name_en:       string
  selling_price: number | null
  tags:          string[]
  description:   string
}

type GlassWine = {
  id:            string
  name:          string
  name_en:       string
  serving_ml:    number
  selling_price: number | null
  wine_type:     string | null
  country:       string | null
  vintage:       number | null
  grape:         string | null
}

export function MenuClient({
  products,
  cocktails,
  glassWines,
}: {
  products:   Product[]
  cocktails:  Cocktail[]
  glassWines: GlassWine[]
}) {
  const locale = useLocale()
  const router = useRouter()
  const t      = useTranslations()

  const [query, setQuery] = useState('')
  const isJa = locale === 'ja'

  // リアルタイム更新
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('menu-stock-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock' },    () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => router.refresh())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [router])

  // カテゴリ順序を保持しながら重複除去
  const categories = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; name_en: string }>()
    products.forEach(p => {
      if (p.category_id && !seen.has(p.category_id)) {
        seen.set(p.category_id, {
          id:      p.category_id,
          name:    p.category_name    ?? '',
          name_en: p.category_name_en ?? '',
        })
      }
    })
    return Array.from(seen.values())
  }, [products])

  const filteredProducts = useMemo(() => {
    if (!query) return products
    const q = query.toLowerCase()
    return products.filter(p => {
      const n = isJa ? p.name : (p.name_en || p.name)
      return n.toLowerCase().includes(q) || p.tags.some(tag => tag.toLowerCase().includes(q))
    })
  }, [products, query, isJa])

  const filteredCocktails = useMemo(() => {
    if (!query) return cocktails
    const q = query.toLowerCase()
    return cocktails.filter(c => {
      const n = isJa ? c.name : (c.name_en || c.name)
      return n.toLowerCase().includes(q) || c.tags.some(tag => tag.toLowerCase().includes(q))
    })
  }, [cocktails, query, isJa])

  const filteredGlassWines = useMemo(() => {
    if (!query) return glassWines
    const q = query.toLowerCase()
    return glassWines.filter(g => {
      const n = isJa ? g.name : (g.name_en || g.name)
      return n.toLowerCase().includes(q) || (g.country ?? '').toLowerCase().includes(q)
    })
  }, [glassWines, query, isJa])

  // カテゴリ＋ワイン種別でグループ化（価格昇順）
  const grouped = useMemo(() => {
    function sortByPrice(items: Product[]) {
      return [...items].sort((a, b) => {
        if (a.selling_price == null && b.selling_price == null) return 0
        if (a.selling_price == null) return 1
        if (b.selling_price == null) return -1
        return a.selling_price - b.selling_price
      })
    }

    const byCat = new Map<string, Product[]>(categories.map(c => [c.id, []]))
    const uncategorized: Product[] = []
    filteredProducts.forEach(p => {
      if (p.category_id && byCat.has(p.category_id)) {
        byCat.get(p.category_id)!.push(p)
      } else {
        uncategorized.push(p)
      }
    })

    const result: { id: string; name: string; name_en: string; items: Product[] }[] = []

    categories.forEach(c => {
      const items = byCat.get(c.id) ?? []
      if (items.length === 0) return

      const hasWineType = items.some(p => p.wine_type && p.wine_type !== 'other')
      if (hasWineType) {
        const wineGroups = new Map<WineType, Product[]>()
        items.forEach(p => {
          const wt = (p.wine_type as WineType) ?? 'other'
          if (!wineGroups.has(wt)) wineGroups.set(wt, [])
          wineGroups.get(wt)!.push(p)
        })
        WINE_TYPE_ORDER.forEach(wt => {
          const wItems = wineGroups.get(wt)
          if (wItems && wItems.length > 0) {
            result.push({
              id:      `${c.id}__${wt}`,
              name:    WINE_TYPE_LABEL[wt],
              name_en: WINE_TYPE_LABEL[wt],
              items:   sortByPrice(wItems),
            })
          }
        })
      } else {
        result.push({ ...c, items: sortByPrice(items) })
      }
    })

    if (uncategorized.length > 0) {
      result.push({ id: '__none__', name: 'Others', name_en: 'Others', items: sortByPrice(uncategorized) })
    }
    return result
  }, [filteredProducts, categories])

  // グラスワインをワイン種別でグループ化
  const glassWineGrouped = useMemo(() => {
    const groups = new Map<WineType, GlassWine[]>()
    filteredGlassWines.forEach(g => {
      const wt = (g.wine_type as WineType) ?? 'other'
      if (!groups.has(wt)) groups.set(wt, [])
      groups.get(wt)!.push(g)
    })
    return WINE_TYPE_ORDER.filter(wt => groups.has(wt)).map(wt => ({
      wt,
      label: WINE_TYPE_LABEL[wt],
      items: groups.get(wt)!,
    }))
  }, [filteredGlassWines])

  const hasContent = grouped.length > 0 || glassWineGrouped.length > 0 || filteredCocktails.length > 0

  return (
    <main className="min-h-screen" style={{ background: '#f8f7f4', color: '#111' }}>

      {/* ── ヘッダー（sticky） */}
      <header className="sticky top-0 z-20" style={{ background: '#f8f7f4', borderBottom: '1px solid #e0ddd8' }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <p className="text-[18px] tracking-[0.12em]" style={{ fontFamily: 'var(--font-doto, monospace)', color: '#111' }}>
              graff.
            </p>
            <TranslateWidget />
          </div>

          {/* 検索 */}
          <div className="pb-3">
            <div className="flex items-center gap-2.5 px-1 h-9" style={{ borderBottom: '1px solid #ccc9c3' }}>
              <RiSearchLine size={13} style={{ color: '#aaa', flexShrink: 0 }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('menu.searchPlaceholder')}
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: '#111' }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── タイトルセクション */}
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-8 text-center" style={{ borderBottom: '1px solid #e0ddd8' }}>
        <p className="text-[10px] tracking-[0.35em] uppercase mb-3" style={{ color: '#aaa' }}>
          DRINK MENU
        </p>
        <h1 className="text-[28px] font-bold tracking-[0.25em] uppercase" style={{ color: '#111', letterSpacing: '0.2em' }}>
          GRAFF
        </h1>
        <div className="w-8 h-px mx-auto mt-4" style={{ background: '#111' }} />
      </div>

      {/* ── メニューリスト */}
      <div className="max-w-2xl mx-auto px-6 pb-20 pt-10">
        {!hasContent ? (
          <p className="text-center py-20 text-sm" style={{ color: '#aaa' }}>
            {t('menu.noResults')}
          </p>
        ) : (
          <div className="space-y-12">

            {/* 通常商品 */}
            {grouped.map(group => (
              <section key={group.id}>
                <SectionHeader label={group.name_en || group.name} />
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
                  {group.items.map(product => (
                    <ProductCard key={product.id} product={product} isJa={isJa} t={t} />
                  ))}
                </div>
              </section>
            ))}

            {/* グラスワイン */}
            {glassWineGrouped.length > 0 && (
              <>
                {glassWineGrouped.map(({ wt, label, items }) => (
                  <section key={`glass__${wt}`}>
                    <SectionHeader label={`GLASS · ${label}`} />
                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
                      {items.map(g => (
                        <GlassWineCard key={g.id} item={g} isJa={isJa} />
                      ))}
                    </div>
                  </section>
                ))}
              </>
            )}

            {/* カクテル */}
            {filteredCocktails.length > 0 && (
              <section>
                <SectionHeader label="COCKTAILS" />
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
                  {filteredCocktails.map(c => (
                    <CocktailCard key={c.id} cocktail={c} isJa={isJa} />
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </main>
  )
}

/* ── セクションヘッダー */
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mb-5 pb-2.5" style={{ borderBottom: '1px solid #111' }}>
      <h2 className="text-[11px] font-bold tracking-[0.25em] uppercase" style={{ color: '#111' }}>
        {label}
      </h2>
    </div>
  )
}

/* ── アイテム区切り線 */
function ItemDivider() {
  return <div style={{ borderBottom: '1px solid #e8e5e0' }} />
}

/* ── 通常商品カード */
function ProductCard({ product, isJa, t }: { product: Product; isJa: boolean; t: ReturnType<typeof useTranslations> }) {
  const name = isJa ? product.name : (product.name_en || product.name)
  const hasSpiritsPrice = product.shot_price != null

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 py-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] font-semibold leading-snug"
            style={{ color: product.is_waiting ? '#bbb' : '#111' }}
          >
            {name}
            {product.is_recommended && !product.is_waiting && (
              <span
                className="ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded align-middle"
                style={{ background: '#111', color: '#fff' }}
              >
                FEATURED
              </span>
            )}
            {product.custom_tag && !product.is_waiting && (
              <span
                className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded align-middle"
                style={{ border: '1px solid #ccc', color: '#888' }}
              >
                {product.custom_tag}
              </span>
            )}
          </p>

          {/* タグ */}
          {product.tags.length > 0 && (
            <p className="text-[11px] mt-0.5" style={{ color: '#aaa' }}>
              {product.tags.join(' · ')}
            </p>
          )}

          {/* スピリッツ: Single / Bottle */}
          {hasSpiritsPrice && !product.is_waiting && (
            <p translate="no" className="text-[11px] mt-0.5 tabular-nums" style={{ color: '#888' }}>
              {product.shot_price != null && `Single ¥${product.shot_price.toLocaleString()}`}
              {product.shot_price != null && product.selling_price != null && '  ·  '}
              {product.selling_price != null && `Bottle ¥${product.selling_price.toLocaleString()}`}
            </p>
          )}
        </div>

        {/* 価格（スピリッツ以外 or Coming Soon） */}
        {(!hasSpiritsPrice || product.is_waiting) && (
          <span
            translate="no"
            className="text-[13px] tabular-nums flex-shrink-0"
            style={{ color: product.is_waiting ? '#bbb' : '#111', fontVariantNumeric: 'tabular-nums' }}
          >
            {product.is_waiting
              ? t('menu.comingSoon')
              : product.selling_price != null
                ? `¥${product.selling_price.toLocaleString()}`
                : '—'
            }
          </span>
        )}
      </div>
      <ItemDivider />
    </div>
  )
}

/* ── グラスワインカード */
function GlassWineCard({ item, isJa }: { item: GlassWine; isJa: boolean }) {
  const name = isJa ? item.name : (item.name_en || item.name)

  const sub = [
    item.vintage  ? String(item.vintage) : null,
    item.country  ?? null,
    item.grape    ?? null,
  ].filter(Boolean).join(' · ')

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-snug" style={{ color: '#111' }}>
            {name}
          </p>
          {sub && (
            <p className="text-[11px] mt-0.5" style={{ color: '#aaa' }}>
              {sub}{item.serving_ml ? `  ·  ${item.serving_ml}ml` : ''}
            </p>
          )}
          {!sub && item.serving_ml ? (
            <p className="text-[11px] mt-0.5" style={{ color: '#aaa' }}>{item.serving_ml}ml</p>
          ) : null}
        </div>
        <span translate="no" className="text-[13px] tabular-nums flex-shrink-0" style={{ color: '#111' }}>
          {item.selling_price != null ? `¥${item.selling_price.toLocaleString()}` : '—'}
        </span>
      </div>
      <ItemDivider />
    </div>
  )
}

/* ── カクテルカード */
function CocktailCard({ cocktail, isJa }: { cocktail: Cocktail; isJa: boolean }) {
  const name = isJa ? cocktail.name : (cocktail.name_en || cocktail.name)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-snug" style={{ color: '#111' }}>
            {name}
          </p>
          {cocktail.tags.length > 0 && (
            <p className="text-[11px] mt-0.5" style={{ color: '#aaa' }}>
              {cocktail.tags.join(' · ')}
            </p>
          )}
          {cocktail.description && (
            <p className="text-[11px] mt-0.5 italic" style={{ color: '#aaa' }}>
              {cocktail.description}
            </p>
          )}
        </div>
        <span translate="no" className="text-[13px] tabular-nums flex-shrink-0" style={{ color: '#111' }}>
          {cocktail.selling_price != null ? `¥${cocktail.selling_price.toLocaleString()}` : '—'}
        </span>
      </div>
      <ItemDivider />
    </div>
  )
}
