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
    <main className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ヘッダー */}
      <header className="sticky top-0 z-20" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-5">
          <div className="flex items-center justify-between h-14">
            <p className="text-[19px]" style={{ fontFamily: 'var(--font-doto, monospace)', color: 'var(--text-primary)' }}>
              graff.
            </p>
            <TranslateWidget />
          </div>

          {/* 検索 */}
          <div className="pb-3">
            <div
              className="flex items-center gap-2.5 px-3.5 h-9 rounded-lg"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <RiSearchLine size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('menu.searchPlaceholder')}
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* メニューリスト */}
      <div className="max-w-3xl mx-auto px-5 pb-16 pt-6">
        {!hasContent ? (
          <p className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('menu.noResults')}
          </p>
        ) : (
          <div className="space-y-8">

            {/* ── 通常商品（カテゴリ別） */}
            {grouped.map(group => (
              <section key={group.id}>
                <SectionHeader label={group.name_en || group.name} />
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 gap-y-5">
                  {group.items.map(product => (
                    <ProductCard key={product.id} product={product} isJa={isJa} />
                  ))}
                </div>
              </section>
            ))}

            {/* ── グラスワイン */}
            {glassWineGrouped.length > 0 && (
              <>
                {glassWineGrouped.map(({ wt, label, items }) => (
                  <section key={`glass__${wt}`}>
                    <SectionHeader label={`GLASS · ${label}`} />
                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 gap-y-5">
                      {items.map(g => (
                        <GlassWineCard key={g.id} item={g} isJa={isJa} />
                      ))}
                    </div>
                  </section>
                ))}
              </>
            )}

            {/* ── カクテル */}
            {filteredCocktails.length > 0 && (
              <section>
                <SectionHeader label="COCKTAILS" />
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 gap-y-5">
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
    <div className="px-3 py-2 mb-4" style={{ background: 'var(--bg-dark)' }}>
      <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>
        {label}
      </h2>
    </div>
  )
}

/* ── 区切り線 */
function Divider() {
  return <div className="mt-4" style={{ borderBottom: '1px solid var(--border)' }} />
}

/* ── 通常商品カード */
function ProductCard({ product, isJa }: { product: Product; isJa: boolean }) {
  const t = useTranslations()
  const name = isJa ? product.name : (product.name_en || product.name)
  const hasSpiritsPrice = product.shot_price != null

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p
          className="text-[13px] font-bold leading-snug"
          style={{ color: product.is_waiting ? 'var(--text-muted)' : 'var(--text-primary)' }}
        >
          {name}
          {product.is_recommended && !product.is_waiting && (
            <span
              className="ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded align-middle"
              style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
            >
              FEATURED
            </span>
          )}
          {product.custom_tag && !product.is_waiting && (
            <span
              className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded align-middle"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              {product.custom_tag}
            </span>
          )}
        </p>

        {/* スピリッツ以外 or Coming Soon は右に価格 */}
        {(!hasSpiritsPrice || product.is_waiting) && (
          <span
            translate="no"
            className="text-[13px] font-bold tabular-nums flex-shrink-0"
            style={{ color: product.is_waiting ? 'var(--text-muted)' : 'var(--text-primary)' }}
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

      {/* スピリッツ: Single / Bottle 価格 */}
      {hasSpiritsPrice && !product.is_waiting && (
        <p translate="no" className="text-[11px] mt-0.5 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          {product.shot_price != null && `Single ¥${product.shot_price.toLocaleString()}`}
          {product.shot_price != null && product.selling_price != null && '  ·  '}
          {product.selling_price != null && `Bottle ¥${product.selling_price.toLocaleString()}`}
        </p>
      )}

      {/* タグ */}
      {product.tags.length > 0 && (
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {product.tags.join(' · ')}
        </p>
      )}

      <Divider />
    </div>
  )
}

/* ── グラスワインカード */
function GlassWineCard({ item, isJa }: { item: GlassWine; isJa: boolean }) {
  const name = isJa ? item.name : (item.name_en || item.name)

  // サブ情報: ヴィンテージ / 産地 / ブドウ品種
  const sub = [
    item.vintage  ? String(item.vintage) : null,
    item.country  ?? null,
    item.grape    ?? null,
  ].filter(Boolean).join(' · ')

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
          {name}
        </p>
        <span translate="no" className="text-[13px] font-bold tabular-nums flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
          {item.selling_price != null ? `¥${item.selling_price.toLocaleString()}` : '—'}
        </span>
      </div>

      {/* サブ情報 */}
      {sub && (
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {sub}
          {item.serving_ml ? `  ·  ${item.serving_ml}ml` : ''}
        </p>
      )}
      {!sub && item.serving_ml ? (
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {item.serving_ml}ml
        </p>
      ) : null}

      <Divider />
    </div>
  )
}

/* ── カクテルカード */
function CocktailCard({ cocktail, isJa }: { cocktail: Cocktail; isJa: boolean }) {
  const name = isJa ? cocktail.name : (cocktail.name_en || cocktail.name)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
          {name}
        </p>
        <span translate="no" className="text-[13px] font-bold tabular-nums flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
          {cocktail.selling_price != null ? `¥${cocktail.selling_price.toLocaleString()}` : '—'}
        </span>
      </div>

      {/* タグ（味の特徴） */}
      {cocktail.tags.length > 0 && (
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {cocktail.tags.join(' · ')}
        </p>
      )}

      {/* description */}
      {cocktail.description && (
        <p className="text-[11px] mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>
          {cocktail.description}
        </p>
      )}

      <Divider />
    </div>
  )
}
