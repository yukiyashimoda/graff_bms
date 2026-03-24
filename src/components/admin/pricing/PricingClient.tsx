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
  if (rate === null) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  const color = rate > 40 ? '#f87171' : rate > 30 ? '#fb923c' : '#22c55e'
  return (
    <span className="text-xs font-bold tabular-nums" style={{ color }}>
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
  const [query,   setQuery]   = useState('')
  const [catFilter, setCat]   = useState<string | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

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

  // 変更があるものだけ
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
    <div className="space-y-4">
      {/* ツールバー */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* 検索 */}
        <div
          className="flex items-center gap-2 px-3 h-10 rounded-xl flex-1 min-w-48"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <RiSearchLine size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="商品名で検索..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {/* カテゴリフィルター */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCat(null)}
            className="h-10 px-3 rounded-xl text-xs font-medium transition-all"
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
              className="h-10 px-3 rounded-xl text-xs font-medium transition-all"
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

        {/* 更新ボタン */}
        <button
          onClick={handleSave}
          disabled={saving || dirtyCount === 0}
          className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 ml-auto"
          style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
        >
          <RiCheckFill size={14} />
          {saving ? '保存中...' : saved ? '保存済み' : `${dirtyCount > 0 ? `${dirtyCount}件を` : ''}更新`}
        </button>
      </div>

      {/* テーブル */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RiPriceTag3Fill size={28} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>該当する商品がありません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['商品名 / VT', 'カテゴリ', '仕入れ価格', '販売価格', '原価率'].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const isLast    = i === filtered.length - 1
                const isDirty   = prices[p.id] !== (p.selling_price != null ? String(p.selling_price) : '')
                const rate      = calcRate(p.cost_price, prices[p.id])

                return (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-[var(--bg-base)]"
                    style={{
                      borderBottom: isLast ? 'none' : '1px solid var(--border)',
                      background:   isDirty ? 'rgba(0,0,0,0.02)' : undefined,
                    }}
                  >
                    {/* 商品名 / VT */}
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {p.name}
                      </p>
                      {p.name_en && (
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {p.name_en}
                        </p>
                      )}
                    </td>

                    {/* カテゴリ */}
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {p.category_name ?? '—'}
                      </span>
                    </td>

                    {/* 仕入れ価格 */}
                    <td className="px-4 py-3">
                      <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        {p.cost_price != null ? `¥${p.cost_price.toLocaleString()}` : '—'}
                      </span>
                    </td>

                    {/* 販売価格（編集可） */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>¥</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={prices[p.id]}
                          onChange={e => setPrices(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="0"
                          className="w-28 px-2 py-1.5 rounded-lg text-sm tabular-nums outline-none text-right"
                          style={{
                            background: isDirty ? 'var(--bg-base)' : 'transparent',
                            border:     `1px solid ${isDirty ? 'var(--bg-dark)' : 'var(--border)'}`,
                            color:      'var(--text-primary)',
                          }}
                        />
                      </div>
                    </td>

                    {/* 原価率 */}
                    <td className="px-4 py-3">
                      <RateChip rate={rate} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* 変更件数フッター */}
      {dirtyCount > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {dirtyCount} 件に未保存の変更があります
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ color: 'var(--text-primary)' }}
          >
            <RiCheckFill size={13} />
            {saving ? '保存中...' : '今すぐ保存'}
          </button>
        </div>
      )}
    </div>
  )
}
