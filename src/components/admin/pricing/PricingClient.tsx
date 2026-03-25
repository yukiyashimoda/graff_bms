'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RiCheckFill, RiSearchLine, RiPriceTag3Fill } from 'react-icons/ri'
import { bulkUpdateSellingPrices } from '@/app/admin/(protected)/products/actions'

type ProductRow = {
  id:            string
  name:          string
  name_en:       string
  cost_price:    number | null
  selling_price: number | null
  category_name: string | null
}

function calcRate(cost: number | null, sell: string): number | null {
  const c = cost
  const s = parseFloat(sell)
  if (!c || !s || s === 0) return null
  return Math.round((c / s) * 1000) / 10
}

function RateChip({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>—</span>
  const color = rate > 40 ? '#f87171' : rate > 30 ? '#fb923c' : '#22c55e'
  return (
    <span className="text-sm font-bold tabular-nums" style={{ color }}>
      {rate}%
    </span>
  )
}

export function PricingClient({ products }: { products: ProductRow[] }) {
  const router = useRouter()

  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      products.map(p => [p.id, p.selling_price != null ? String(p.selling_price) : ''])
    )
  )
  const [query,     setQuery]   = useState('')
  const [catFilter, setCat]     = useState<string | null>(null)
  const [saving,    setSaving]  = useState(false)
  const [saved,     setSaved]   = useState(false)

  const categories = useMemo(() => {
    const seen = new Set<string>()
    return products
      .map(p => p.category_name)
      .filter((c): c is string => !!c && !seen.has(c) && !!seen.add(c))
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (catFilter && p.category_name !== catFilter) return false
      if (!query) return true
      const q = query.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.name_en.toLowerCase().includes(q)
    })
  }, [products, query, catFilter])

  const dirtyCount = products.filter(p => {
    const current = p.selling_price != null ? String(p.selling_price) : ''
    return prices[p.id] !== current
  }).length

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setSaved(false)
    try {
      const items = products
        .filter(p => {
          const current = p.selling_price != null ? String(p.selling_price) : ''
          return prices[p.id] !== current
        })
        .map(p => {
          const val = parseFloat(prices[p.id])
          return { id: p.id, selling_price: isNaN(val) ? null : val }
        })
      if (items.length > 0) {
        await bulkUpdateSellingPrices(items)
        setSaved(true)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <div className="space-y-4 pb-24">
      {/* ツールバー */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* 検索 */}
        <div
          className="flex items-center gap-2 px-3 h-11 rounded-xl flex-1 min-w-48"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <RiSearchLine size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="商品名で検索..."
            className="flex-1 text-base bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {/* カテゴリフィルター */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCat(null)}
            className="h-11 px-3 rounded-xl text-xs font-medium transition-all"
            style={{
              background: catFilter === null ? 'var(--bg-dark)' : 'var(--bg-surface)',
              color:      catFilter === null ? 'var(--text-invert)' : 'var(--text-secondary)',
              border:     catFilter === null ? 'none' : '1px solid var(--border)',
            }}
          >
            すべて
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCat(c === catFilter ? null : c)}
              className="h-11 px-3 rounded-xl text-xs font-medium transition-all"
              style={{
                background: catFilter === c ? 'var(--bg-dark)' : 'var(--bg-surface)',
                color:      catFilter === c ? 'var(--text-invert)' : 'var(--text-secondary)',
                border:     catFilter === c ? 'none' : '1px solid var(--border)',
              }}
            >
              {c}
            </button>
          ))}
        </div>

      </div>

      {/* フローティング更新ボタン（左下固定） */}
      <button
        onClick={handleSave}
        disabled={saving || dirtyCount === 0}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-lg transition-all disabled:opacity-0 disabled:pointer-events-none hover:opacity-90 active:scale-95"
        style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
      >
        <RiCheckFill size={16} />
        {saving ? '保存中...' : saved ? '保存しました' : `${dirtyCount}件を更新`}
      </button>

      {/* カード一覧 */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <RiPriceTag3Fill size={28} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>該当する商品がありません</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => {
            const isDirty = prices[p.id] !== (p.selling_price != null ? String(p.selling_price) : '')
            const rate    = calcRate(p.cost_price, prices[p.id])

            return (
              <div
                key={p.id}
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{
                  background: isDirty ? 'var(--bg-surface)' : 'var(--bg-surface)',
                  border: `1px solid ${isDirty ? 'var(--bg-dark)' : 'var(--border)'}`,
                }}
              >
                {/* 商品名 + カテゴリ */}
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {p.name}
                    </p>
                    {p.name_en && (
                      <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {p.name_en}
                      </p>
                    )}
                  </div>
                  {p.category_name && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md flex-shrink-0"
                      style={{ background: '#102937', color: '#ededed' }}
                    >
                      {p.category_name}
                    </span>
                  )}
                </div>

                {/* 仕入れ価格 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>仕入れ価格</span>
                  <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {p.cost_price != null ? `¥${p.cost_price.toLocaleString()}` : '—'}
                  </span>
                </div>

                {/* 販売価格入力 */}
                <div
                  className="flex items-center gap-2 px-3 py-3 rounded-xl"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>販売価格</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>¥</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={prices[p.id]}
                      onChange={e => setPrices(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="0"
                      className="w-24 text-base tabular-nums outline-none text-right bg-transparent"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {/* 原価率 */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>原価率</span>
                  <RateChip rate={rate} />
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
    </>
  )
}
