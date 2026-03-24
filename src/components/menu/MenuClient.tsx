'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { RiSearchLine, RiTranslate2 } from 'react-icons/ri'
import { createClient } from '@/lib/supabase/client'

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
}

export function MenuClient({ products }: { products: Product[] }) {
  const locale   = useLocale()
  const router   = useRouter()
  const pathname = usePathname()
  const t        = useTranslations()

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

  function toggleLocale() {
    const next     = isJa ? 'en' : 'ja'
    const segments = pathname.split('/')
    segments[1]    = next
    router.push(segments.join('/') || '/')
  }

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

  const filtered = useMemo(() => {
    if (!query) return products
    const q = query.toLowerCase()
    return products.filter(p => {
      const n = isJa ? p.name : (p.name_en || p.name)
      return n.toLowerCase().includes(q) || p.tags.some(tag => tag.toLowerCase().includes(q))
    })
  }, [products, query, isJa])

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

    // カテゴリIDごとにまず仕分け
    const byCat = new Map<string, Product[]>(categories.map(c => [c.id, []]))
    const uncategorized: Product[] = []
    filtered.forEach(p => {
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

      // ワイン種別を持つ商品が1つでもあればワイン別に分割
      const hasWineType = items.some(p => p.wine_type && p.wine_type !== 'other')
      if (hasWineType) {
        const wineGroups = new Map<WineType, Product[]>()
        items.forEach(p => {
          const wt = (p.wine_type as WineType) ?? 'other'
          if (!wineGroups.has(wt)) wineGroups.set(wt, [])
          wineGroups.get(wt)!.push(p)
        })
        // 白 → 赤 → ロゼ → スパークリング → シャンパン → その他 の順
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
  }, [filtered, categories])

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ヘッダー */}
      <header className="sticky top-0 z-20" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-5">
          <div className="flex items-center justify-between h-14">
            <p className="text-[19px]" style={{ fontFamily: 'var(--font-silkscreen)', color: 'var(--text-primary)' }}>
              graff.
            </p>
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              <RiTranslate2 size={13} />
              {isJa ? 'EN' : 'JA'}
            </button>
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
        {grouped.length === 0 ? (
          <p className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>
            該当する商品がありません
          </p>
        ) : (
          <div className="space-y-8">
            {grouped.map(group => (
              <section key={group.id}>

                {/* カテゴリヘッダー */}
                <div
                  className="px-3 py-2 mb-4"
                  style={{ background: 'var(--bg-dark)' }}
                >
                  <h2
                    className="text-sm font-bold tracking-widest uppercase"
                    style={{ color: 'var(--text-invert)' }}
                  >
                    {group.name_en || group.name}
                  </h2>
                </div>

                {/* 商品リスト */}
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 gap-y-5">
                  {group.items.map(product => {
                    const name = isJa ? product.name : (product.name_en || product.name)
                    return (
                      <div key={product.id}>
                        {/* 名前 + 価格 */}
                        <div className="flex items-baseline justify-between gap-3">
                          <p
                            className="text-[13px] font-bold leading-snug"
                            style={{ color: product.is_waiting ? 'var(--text-muted)' : 'var(--text-primary)' }}
                          >
                            {name}
                            {product.is_recommended && !product.is_waiting && (
                              <span
                                className="ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded align-middle"
                                style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
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
                          <span
                            className="text-[13px] font-bold tabular-nums flex-shrink-0"
                            style={{ color: product.is_waiting ? 'var(--text-muted)' : 'var(--text-primary)' }}
                          >
                            {product.is_waiting
                              ? 'Coming Soon'
                              : product.selling_price != null
                                ? `¥${product.selling_price.toLocaleString()}`
                                : '—'
                            }
                          </span>
                        </div>

                        {/* タグ */}
                        {product.tags.length > 0 && (
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {product.tags.join(' · ')}
                          </p>
                        )}

                        {/* 区切り線 */}
                        <div className="mt-4" style={{ borderBottom: '1px solid var(--border)' }} />
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
