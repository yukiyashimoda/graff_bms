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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>商品管理</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {query ? `${filtered.length} / ${products.length} 件` : `${products.length} 件`}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          {/* 検索窓 */}
          <div
            className="flex items-center gap-2 px-3 h-9 rounded-xl flex-1 max-w-64"
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
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="pl-4 pr-2 py-3 w-10 text-xs font-semibold text-left" style={{ color: 'var(--text-muted)' }}>表示</th>
                {['商品名', 'カテゴリ', '発注先', '販売価格', '最低在庫', '状態', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <ProductRow key={product.id} product={product} isLast={i === filtered.length - 1} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
