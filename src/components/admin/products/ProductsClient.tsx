'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { RiSearchLine, RiAddLine, RiArrowDownSLine, RiArchiveFill } from 'react-icons/ri'
import { ProductRow } from './ProductRow'
import type { ProductWithRelations } from '@/lib/types/database'

export function ProductsClient({ products }: { products: ProductWithRelations[] }) {
  const [query,     setQuery]     = useState('')
  const [catFilter, setCatFilter] = useState<string | null>(null)

  const categories = useMemo(() => {
    const seen = new Set<string>()
    return products
      .map(p => (p.categories as { name: string } | null)?.name)
      .filter((c): c is string => !!c && !seen.has(c) && !!seen.add(c))
      .sort()
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const cat = (p.categories as { name: string } | null)?.name ?? ''
      const sup = (p.suppliers  as { name: string } | null)?.name ?? ''
      if (catFilter && cat !== catFilter) return false
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.name_en ?? '').toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        sup.toLowerCase().includes(q)
      )
    })
  }, [products, query, catFilter])

  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-3">
        <div>
          <h1
            className="text-2xl"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-space-grotesk, system-ui)', fontWeight: 700, letterSpacing: '0.05em' }}
          >
            PRODUCTS
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {(query || catFilter) ? `${filtered.length} / ${products.length} 件` : `${products.length} 件`}
          </p>
        </div>

        {/* 検索 + カテゴリフィルター */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <RiSearchLine
              size={14}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
            />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="商品名・カテゴリ・発注先..."
              className="w-full appearance-none rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', height: '44px', paddingLeft: '32px', paddingRight: '12px', boxSizing: 'border-box' }}
            />
          </div>

          {categories.length > 0 && (
            <div className="relative sm:w-44">
              <select
                value={catFilter ?? ''}
                onChange={e => setCatFilter(e.target.value || null)}
                className="w-full appearance-none pl-3 pr-8 rounded-xl text-sm outline-none cursor-pointer"
                style={{ background: 'var(--bg-surface)', color: catFilter ? 'var(--text-primary)' : 'var(--text-secondary)', border: '1px solid var(--border)', height: '44px' }}
              >
                <option value="" style={{ background: '#0c141c', color: '#e7eef9' }}>すべてのカテゴリ</option>
                {categories.map(c => (
                  <option key={c} value={c} style={{ background: '#0c141c', color: '#e7eef9' }}>{c}</option>
                ))}
              </select>
              <RiArrowDownSLine
                size={14}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* フローティング追加ボタン */}
      <Link
        href="/admin/products/new"
        className="fixed bottom-24 right-6 lg:bottom-6 z-40 w-14 h-14 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95"
        style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
        title="商品を追加"
      >
        <RiAddLine size={24} />
      </Link>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RiArchiveFill size={32} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>商品がまだありません</p>
          <Link
            href="/admin/products/new"
            className="px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
          >
            まずは商品を追加しましょう
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <RiSearchLine size={28} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>「{query}」に一致する商品がありません</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(product => (
            <ProductRow key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
