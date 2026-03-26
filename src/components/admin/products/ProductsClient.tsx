'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { RiSearchLine, RiArchiveFill, RiAddLine } from 'react-icons/ri'
import { ProductRow } from './ProductRow'
import type { ProductWithRelations } from '@/lib/types/database'

export function ProductsClient({ products }: { products: ProductWithRelations[] }) {
  const [query, setQuery]       = useState('')
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
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>メニュー管理</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {(query || catFilter) ? `${filtered.length} / ${products.length} 件` : `${products.length} 件`}
          </p>
        </div>

        {/* カテゴリフィルター */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <CatBtn label="すべて" active={catFilter === null} onClick={() => setCatFilter(null)} />
            {categories.map(c => (
              <CatBtn key={c} label={c} active={catFilter === c} onClick={() => setCatFilter(c)} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* 検索窓 */}
          <div
            className="flex items-center gap-2 px-3 h-11 rounded-xl flex-1"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <RiSearchLine size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="商品名・カテゴリ・発注先..."
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 px-4 h-11 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 flex-shrink-0"
            style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
          >
            <RiAddLine size={16} />
            <span className="hidden sm:inline">商品を追加</span>
            <span className="sm:hidden">追加</span>
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RiArchiveFill size={32} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>商品がまだありません</p>
          <Link href="/admin/products/new" className="text-sm font-medium underline underline-offset-2" style={{ color: 'var(--text-secondary)' }}>
            最初の商品を追加する
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <RiSearchLine size={28} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>「{query}」に一致する商品がありません</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 165px), 1fr))' }}>
          {filtered.map(product => (
            <ProductRow key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

function CatBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
      style={active
        ? { background: '#102937', color: '#ededed' }
        : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
      }
    >
      {label}
    </button>
  )
}
