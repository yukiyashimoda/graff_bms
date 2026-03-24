'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { RiSearchLine, RiArchiveFill, RiAddLine } from 'react-icons/ri'
import { ProductRow } from './ProductRow'
import type { ProductWithRelations } from '@/lib/types/database'

export function ProductsClient({ products }: { products: ProductWithRelations[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return products
    const q = query.toLowerCase()
    return products.filter(p => {
      const cat = (p.categories as { name: string } | null)?.name ?? ''
      const sup = (p.suppliers  as { name: string } | null)?.name ?? ''
      return (
        p.name.toLowerCase().includes(q) ||
        (p.name_en ?? '').toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        sup.toLowerCase().includes(q)
      )
    })
  }, [products, query])

  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>商品管理</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {query ? `${filtered.length} / ${products.length} 件` : `${products.length} 件`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 検索窓 */}
          <div
            className="flex items-center gap-2 px-3 h-9 rounded-xl flex-1"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <RiSearchLine size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 flex-shrink-0"
            style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
          >
            <RiAddLine size={15} />
            商品を追加
          </Link>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
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
          <div className="grid gap-3 p-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))' }}>
            {filtered.map(product => (
              <ProductRow key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
