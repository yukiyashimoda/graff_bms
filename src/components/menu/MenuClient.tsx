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

// ウイスキー系スピリッツタイプ
const WHISKY_TYPES = new Set(['scotch', 'japanese', 'bourbon', 'irish', 'whisky', 'blended', 'american', 'single malt'])

// ── セクション表示順（数値が小さいほど上）
const SECTION_SORT: Record<string, number> = {
  beer:      10,
  whisky:    20,  // スピリッツから分割したウイスキー
  wine:      30,  // ボトルワイン（タイプ別）
  champagne: 35,  // ボトルシャンパン
  glass:     25,  // グラスワイン（ビール・ハイボールの次）
  cocktail:  50,
  spirits:   60,  // ウイスキー以外のスピリッツ
  soft:      70,
  food:      80,
  others:    90,
}

function getCatSortKey(nameEn: string): number {
  const n = nameEn.toLowerCase()
  if (n.includes('beer'))                               return SECTION_SORT.beer
  if (n === 'whisky & highball')                        return SECTION_SORT.whisky
  if (n.includes('white wine') || n.includes('red wine') ||
      n.includes('rosé') || n === 'wine')              return SECTION_SORT.wine
  if (n.includes('champagne') || n.includes('sparkling') ||
      n.includes('cava') || n.includes('prosecco'))    return SECTION_SORT.champagne
  if (n.includes('glass'))                              return SECTION_SORT.glass
  if (n.includes('cocktail'))                           return SECTION_SORT.cocktail
  if (n.includes('spirit'))                             return SECTION_SORT.spirits
  if (n.includes('soft') || n.includes('drink') ||
      n.includes('mocktail') || n.includes('non'))      return SECTION_SORT.soft
  if (n.includes('food'))                               return SECTION_SORT.food
  return SECTION_SORT.others
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

type ProductSection = { kind: 'products'; sortKey: number; id: string; label: string; items: Product[] }
type GlassSection   = { kind: 'glass';    sortKey: number; label: string; items: GlassWine[] }
type CocktailSection = { kind: 'cocktails'; sortKey: number; items: Cocktail[] }
type MenuSection = ProductSection | GlassSection | CocktailSection

/* ── SVGフィルター定義（文字掠れのみ） */
function PaperFilters() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden>
      <defs>
        <filter id="kasure" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="4"
            seed="7"
            result="noise"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -10 8.5"
            in="noise"
            result="mask"
          />
          <feComposite in="SourceGraphic" in2="mask" operator="in" />
        </filter>
      </defs>
    </svg>
  )
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

  // ── 全セクションを一つのリストにまとめてソート
  const sections = useMemo<MenuSection[]>(() => {
    function sortByPrice(items: Product[]) {
      return [...items].sort((a, b) => {
        if (a.selling_price == null && b.selling_price == null) return 0
        if (a.selling_price == null) return 1
        if (b.selling_price == null) return -1
        return a.selling_price - b.selling_price
      })
    }

    const result: MenuSection[] = []

    // ── 商品カテゴリ
    const byCat = new Map<string, Product[]>(categories.map(c => [c.id, []]))
    const uncategorized: Product[] = []
    filteredProducts.forEach(p => {
      if (p.category_id && byCat.has(p.category_id)) {
        byCat.get(p.category_id)!.push(p)
      } else {
        uncategorized.push(p)
      }
    })

    categories.forEach(c => {
      const items = byCat.get(c.id) ?? []
      if (items.length === 0) return

      const isSpirits = c.name_en.toLowerCase().includes('spirit')
      const hasWineType = items.some(p => p.wine_type && p.wine_type !== 'other')

      if (isSpirits) {
        // スピリッツ → ウイスキーとその他に分割
        const whiskyItems = items.filter(p => p.spirits_type && WHISKY_TYPES.has(p.spirits_type.toLowerCase()))
        const otherItems  = items.filter(p => !p.spirits_type || !WHISKY_TYPES.has(p.spirits_type.toLowerCase()))

        if (whiskyItems.length > 0) {
          result.push({
            kind: 'products',
            sortKey: SECTION_SORT.whisky,
            id: `${c.id}__whisky`,
            label: 'WHISKY & HIGHBALL',
            items: sortByPrice(whiskyItems),
          })
        }
        if (otherItems.length > 0) {
          result.push({
            kind: 'products',
            sortKey: SECTION_SORT.spirits,
            id: `${c.id}__spirits`,
            label: 'SPIRITS',
            items: sortByPrice(otherItems),
          })
        }
      } else if (hasWineType) {
        // ワイン → タイプ別に分割
        const wineGroups = new Map<WineType, Product[]>()
        items.forEach(p => {
          const wt = (p.wine_type as WineType) ?? 'other'
          if (!wineGroups.has(wt)) wineGroups.set(wt, [])
          wineGroups.get(wt)!.push(p)
        })
        WINE_TYPE_ORDER.forEach(wt => {
          const wItems = wineGroups.get(wt)
          if (!wItems || wItems.length === 0) return
          const label = WINE_TYPE_LABEL[wt]
          const isCh  = wt === 'champagne' || wt === 'sparkling'
          result.push({
            kind: 'products',
            sortKey: isCh ? SECTION_SORT.champagne : SECTION_SORT.wine,
            id: `${c.id}__${wt}`,
            label,
            items: sortByPrice(wItems),
          })
        })
      } else {
        result.push({
          kind: 'products',
          sortKey: getCatSortKey(c.name_en),
          id: c.id,
          label: c.name_en || c.name,
          items: sortByPrice(items),
        })
      }
    })

    if (uncategorized.length > 0) {
      result.push({
        kind: 'products',
        sortKey: SECTION_SORT.others,
        id: '__none__',
        label: 'OTHERS',
        items: sortByPrice(uncategorized),
      })
    }

    // ── グラスワイン
    const glassGroups = new Map<WineType, GlassWine[]>()
    filteredGlassWines.forEach(g => {
      const wt = (g.wine_type as WineType) ?? 'other'
      if (!glassGroups.has(wt)) glassGroups.set(wt, [])
      glassGroups.get(wt)!.push(g)
    })
    WINE_TYPE_ORDER.filter(wt => glassGroups.has(wt)).forEach(wt => {
      result.push({
        kind: 'glass',
        sortKey: SECTION_SORT.glass,
        label: `GLASS · ${WINE_TYPE_LABEL[wt]}`,
        items: glassGroups.get(wt)!,
      })
    })

    // ── カクテル
    if (filteredCocktails.length > 0) {
      result.push({
        kind: 'cocktails',
        sortKey: SECTION_SORT.cocktail,
        items: filteredCocktails,
      })
    }

    // ── sortKey で昇順ソート
    return result.sort((a, b) => a.sortKey - b.sortKey)
  }, [filteredProducts, filteredGlassWines, filteredCocktails, categories, isJa])

  const hasContent = sections.length > 0

  return (
    <>
      <PaperFilters />

      <main className="relative min-h-screen" style={{ background: '#f6f5f2', color: '#1c1712' }}>

        {/* ── ヘッダー（sticky） */}
        <header
          className="sticky top-0 z-20"
          style={{ background: 'rgba(246,245,242,0.92)', backdropFilter: 'blur(8px)' }}
        >
          <div className="max-w-2xl mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              <p
                className="text-[18px] tracking-[0.12em]"
                style={{ fontFamily: 'var(--font-doto, monospace)', color: '#1c1712', filter: 'url(#kasure)' }}
              >
                graff.
              </p>
              <TranslateWidget />
            </div>

            {/* 検索 */}
            <div className="pb-3">
              <div
                className="flex items-center gap-2.5 px-1 h-9"
                style={{ borderBottom: '1px solid rgba(28,23,18,0.2)' }}
              >
                <RiSearchLine size={13} style={{ color: '#9a8f82', flexShrink: 0 }} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t('menu.searchPlaceholder')}
                  className="flex-1 text-sm bg-transparent outline-none"
                  style={{ color: '#1c1712' }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* ── タイトルセクション */}
        <div className="max-w-2xl mx-auto px-6 pt-10 pb-8 text-center">
          <p
            className="text-[10px] tracking-[0.35em] uppercase mb-3"
            style={{ color: '#9a8f82', filter: 'url(#kasure)' }}
          >
            DRINK MENU
          </p>
          <h1
            className="text-[28px] font-bold tracking-[0.25em] uppercase"
            style={{ color: '#1c1712', filter: 'url(#kasure)' }}
          >
            GRAFF
          </h1>
          <div className="w-8 h-px mx-auto mt-4" style={{ background: '#1c1712', opacity: 0.4 }} />
        </div>

        {/* ── メニューリスト */}
        <div className="max-w-2xl mx-auto px-6 pb-20 pt-6">
          {!hasContent ? (
            <p className="text-center py-20 text-sm" style={{ color: '#9a8f82' }}>
              {t('menu.noResults')}
            </p>
          ) : (
            <div className="space-y-12">
              {sections.map((sec, i) => {
                if (sec.kind === 'products') {
                  return (
                    <section key={sec.id}>
                      <SectionHeader label={sec.label} />
                      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
                        {sec.items.map(product => (
                          <ProductCard key={product.id} product={product} isJa={isJa} t={t} />
                        ))}
                      </div>
                    </section>
                  )
                }
                if (sec.kind === 'glass') {
                  return (
                    <section key={`glass__${i}`}>
                      <SectionHeader label={sec.label} />
                      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
                        {sec.items.map(g => (
                          <GlassWineCard key={g.id} item={g} isJa={isJa} />
                        ))}
                      </div>
                    </section>
                  )
                }
                // cocktails
                return (
                  <section key="cocktails">
                    <SectionHeader label="COCKTAILS" />
                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
                      {sec.items.map(c => (
                        <CocktailCard key={c.id} cocktail={c} isJa={isJa} />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

/* ── セクションヘッダー */
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mb-6 mt-2">
      <h2
        className="text-[10px] font-bold tracking-[0.3em] uppercase"
        style={{ color: '#1c1712', filter: 'url(#kasure)' }}
      >
        {label}
      </h2>
      <div className="mt-2 w-full h-px" style={{ background: 'rgba(28,23,18,0.15)' }} />
    </div>
  )
}

const jaFont = { fontFamily: 'var(--font-shippori, serif)' }

/* ── 通常商品カード */
function ProductCard({ product, isJa, t }: { product: Product; isJa: boolean; t: ReturnType<typeof useTranslations> }) {
  const name = isJa ? product.name : (product.name_en || product.name)
  const hasSpiritsPrice = product.shot_price != null

  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] font-semibold leading-snug"
            style={{ color: '#1c1712', filter: 'url(#kasure)', ...(isJa ? jaFont : {}) }}
          >
            {name}
            {product.is_recommended && !product.is_waiting && (
              <span
                className="ml-2 text-[8px] font-bold px-1.5 py-0.5 rounded align-middle tracking-widest"
                style={{ background: 'rgba(28,23,18,0.08)', color: '#1c1712', border: '1px solid rgba(28,23,18,0.2)', fontFamily: 'inherit' }}
              >
                FEATURED
              </span>
            )}
            {product.custom_tag && !product.is_waiting && (
              <span
                className="ml-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded align-middle tracking-widest"
                style={{ border: '1px solid rgba(28,23,18,0.18)', color: '#1c1712', fontFamily: 'inherit' }}
              >
                {product.custom_tag}
              </span>
            )}
          </p>

          {product.tags.length > 0 && (
            <p className="text-[10px] mt-1.5" style={{ color: '#1c1712' }}>
              {product.tags.join(' · ')}
            </p>
          )}

          {hasSpiritsPrice && !product.is_waiting && (
            <p translate="no" className="text-[11px] mt-0.5 tabular-nums" style={{ color: '#1c1712', filter: 'url(#kasure)' }}>
              {product.shot_price != null && `Single ¥${product.shot_price.toLocaleString()}`}
              {product.shot_price != null && product.selling_price != null && '  ·  '}
              {product.selling_price != null && `Bottle ¥${product.selling_price.toLocaleString()}`}
            </p>
          )}
        </div>

        {(!hasSpiritsPrice || product.is_waiting) && (
          <span
            translate="no"
            className="text-[13px] tabular-nums flex-shrink-0"
            style={{ color: '#1c1712', filter: 'url(#kasure)' }}
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
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-snug" style={{ color: '#1c1712', filter: 'url(#kasure)', ...(isJa ? jaFont : {}) }}>
            {name}
          </p>
          {sub && (
            <p className="text-[10px] mt-1.5" style={{ color: '#1c1712' }}>
              {sub}{item.serving_ml ? `  ·  ${item.serving_ml}ml` : ''}
            </p>
          )}
          {!sub && item.serving_ml ? (
            <p className="text-[10px] mt-1.5" style={{ color: '#1c1712' }}>{item.serving_ml}ml</p>
          ) : null}
        </div>
        <span translate="no" className="text-[13px] tabular-nums flex-shrink-0" style={{ color: '#1c1712', filter: 'url(#kasure)' }}>
          {item.selling_price != null ? `¥${item.selling_price.toLocaleString()}` : '—'}
        </span>
      </div>
    </div>
  )
}

/* ── カクテルカード */
function CocktailCard({ cocktail, isJa }: { cocktail: Cocktail; isJa: boolean }) {
  const name = isJa ? cocktail.name : (cocktail.name_en || cocktail.name)

  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-snug" style={{ color: '#1c1712', filter: 'url(#kasure)', ...(isJa ? jaFont : {}) }}>
            {name}
          </p>
          {cocktail.tags.length > 0 && (
            <p className="text-[10px] mt-1.5" style={{ color: '#1c1712' }}>
              {cocktail.tags.join(' · ')}
            </p>
          )}
          {cocktail.description && (
            <p className="text-[10px] mt-1.5 italic" style={{ color: '#1c1712' }}>
              {cocktail.description}
            </p>
          )}
        </div>
        <span translate="no" className="text-[13px] tabular-nums flex-shrink-0" style={{ color: '#1c1712', filter: 'url(#kasure)' }}>
          {cocktail.selling_price != null ? `¥${cocktail.selling_price.toLocaleString()}` : '—'}
        </span>
      </div>
    </div>
  )
}
