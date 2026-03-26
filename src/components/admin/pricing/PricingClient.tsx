'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RiCheckFill, RiSearchLine, RiPriceTag3Fill } from 'react-icons/ri'
import {
  bulkUpdateSellingPrices,
  bulkUpdateShotPrices,
  bulkUpdateGlassPrices,
  bulkUpdateCocktailPrices,
} from '@/app/admin/(protected)/products/actions'

/* ── 型定義 ── */

type ProductRow = {
  id:            string
  name:          string
  name_en:       string
  cost_price:    number | null
  selling_price: number | null
  category_name: string | null
  shot_price:    number | null
  volume_ml:     number | null
  is_spirits:    boolean
}

type GlassRow = {
  id:            string
  product_name:  string
  name_en:       string
  cost_price:    number | null
  serving_ml:    number
  bottle_ml:     number | null
  selling_price: number | null
}

type CocktailRow = {
  id:            string
  name:          string
  name_en:       string
  selling_price: number | null
  total_cost:    number | null
}

type Tab = 'products' | 'glasses' | 'cocktails'

/* ── 原価率計算 ── */

function bottleRate(cost: number | null, sell: string): number | null {
  const c = cost, s = parseFloat(sell)
  if (!c || !s) return null
  return Math.round((c / s) * 1000) / 10
}

function shotRate(cost: number | null, volume: number | null, shotSell: string): number | null {
  const c = cost, v = volume, s = parseFloat(shotSell)
  if (!c || !v || !s) return null
  const costPerShot = (c / v) * 30
  return Math.round((costPerShot / s) * 1000) / 10
}

function glassRate(cost: number | null, bottleMl: number | null, servingMl: number, sell: string): number | null {
  const s = parseFloat(sell)
  if (!cost || !bottleMl || !s) return null
  const costPerServing = (cost / bottleMl) * servingMl
  return Math.round((costPerServing / s) * 1000) / 10
}

function cocktailRate(totalCost: number | null, sell: string): number | null {
  const c = totalCost, s = parseFloat(sell)
  if (!c || !s) return null
  return Math.round((c / s) * 1000) / 10
}

/* ── 共通コンポーネント ── */

function RateChip({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>—</span>
  const color = rate > 40 ? '#f87171' : rate > 30 ? '#fb923c' : '#22c55e'
  return <span className="text-xs font-bold tabular-nums" style={{ color }}>{rate}%</span>
}

function PriceRow({
  label, sublabel, value, onChange, rateNode,
}: {
  label: string
  sublabel?: string
  value: string
  onChange: (v: string) => void
  rateNode: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {label}
          {sublabel && <span className="ml-1 font-normal" style={{ color: 'var(--text-muted)' }}>{sublabel}</span>}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>原価率</span>
          {rateNode}
        </div>
      </div>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>販売価格</span>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>¥</span>
        <input
          type="number"
          min="0"
          step="100"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          className="w-20 text-base tabular-nums outline-none text-right bg-transparent"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <RiPriceTag3Fill size={28} style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>該当する商品がありません</p>
    </div>
  )
}

/* ── タブ: 商品 ── */

function ProductsTab({ products, prices, setPrices, shotPrices, setShotPrices, query, catFilter }: {
  products: ProductRow[]
  prices: Record<string, string>
  setPrices: React.Dispatch<React.SetStateAction<Record<string, string>>>
  shotPrices: Record<string, string>
  setShotPrices: React.Dispatch<React.SetStateAction<Record<string, string>>>
  query: string
  catFilter: string | null
}) {
  const filtered = useMemo(() => products.filter(p => {
    if (catFilter && p.category_name !== catFilter) return false
    if (!query) return true
    const q = query.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.name_en.toLowerCase().includes(q)
  }), [products, query, catFilter])

  if (filtered.length === 0) return <EmptyState />

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
      {filtered.map(p => {
        const isDirty =
          prices[p.id] !== (p.selling_price != null ? String(p.selling_price) : '') ||
          (p.is_spirits && shotPrices[p.id] !== (p.shot_price != null ? String(p.shot_price) : ''))

        return (
          <div
            key={p.id}
            className="rounded-2xl p-4 flex flex-col gap-3 overflow-hidden"
            style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${isDirty ? 'var(--bg-dark)' : 'var(--border)'}`,
            }}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                {p.name_en && (
                  <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.name_en}</p>
                )}
              </div>
              {p.category_name && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md flex-shrink-0" style={{ background: '#102937', color: '#ededed' }}>
                  {p.category_name}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>仕入れ価格</span>
              <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>
                {p.cost_price != null ? `¥${p.cost_price.toLocaleString()}` : '—'}
              </span>
            </div>

            {p.is_spirits ? (
              <>
                <div style={{ borderTop: '1px solid var(--border)', margin: '0 -4px' }} />
                <PriceRow
                  label="シングル"
                  sublabel="(30ml換算)"
                  value={shotPrices[p.id]}
                  onChange={v => setShotPrices(prev => ({ ...prev, [p.id]: v }))}
                  rateNode={<RateChip rate={shotRate(p.cost_price, p.volume_ml, shotPrices[p.id])} />}
                />
                <PriceRow
                  label="ボトル"
                  value={prices[p.id]}
                  onChange={v => setPrices(prev => ({ ...prev, [p.id]: v }))}
                  rateNode={<RateChip rate={bottleRate(p.cost_price, prices[p.id])} />}
                />
              </>
            ) : (
              <PriceRow
                label="販売価格"
                value={prices[p.id]}
                onChange={v => setPrices(prev => ({ ...prev, [p.id]: v }))}
                rateNode={<RateChip rate={bottleRate(p.cost_price, prices[p.id])} />}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── タブ: グラスワイン ── */

function GlassesTab({ glasses, prices, setPrices, query }: {
  glasses: GlassRow[]
  prices: Record<string, string>
  setPrices: React.Dispatch<React.SetStateAction<Record<string, string>>>
  query: string
}) {
  const filtered = useMemo(() => {
    if (!query) return glasses
    const q = query.toLowerCase()
    return glasses.filter(g => g.product_name.toLowerCase().includes(q) || g.name_en.toLowerCase().includes(q))
  }, [glasses, query])

  if (filtered.length === 0) return <EmptyState />

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
      {filtered.map(g => {
        const isDirty = prices[g.id] !== (g.selling_price != null ? String(g.selling_price) : '')
        const costPerServing = g.cost_price && g.bottle_ml
          ? Math.round((g.cost_price / g.bottle_ml) * g.serving_ml)
          : null

        return (
          <div
            key={g.id}
            className="rounded-2xl p-4 flex flex-col gap-3 overflow-hidden"
            style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${isDirty ? 'var(--bg-dark)' : 'var(--border)'}`,
            }}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{g.product_name}</p>
                {g.name_en && (
                  <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{g.name_en}</p>
                )}
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md flex-shrink-0" style={{ background: '#102937', color: '#ededed' }}>
                {g.serving_ml}ml
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>グラス原価</span>
              <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>
                {costPerServing != null ? `¥${costPerServing.toLocaleString()}` : '—'}
              </span>
            </div>

            <PriceRow
              label="グラス販売価格"
              value={prices[g.id]}
              onChange={v => setPrices(prev => ({ ...prev, [g.id]: v }))}
              rateNode={<RateChip rate={glassRate(g.cost_price, g.bottle_ml, g.serving_ml, prices[g.id])} />}
            />
          </div>
        )
      })}
    </div>
  )
}

/* ── タブ: カクテル ── */

function CocktailsTab({ cocktails, prices, setPrices, query }: {
  cocktails: CocktailRow[]
  prices: Record<string, string>
  setPrices: React.Dispatch<React.SetStateAction<Record<string, string>>>
  query: string
}) {
  const filtered = useMemo(() => {
    if (!query) return cocktails
    const q = query.toLowerCase()
    return cocktails.filter(c => c.name.toLowerCase().includes(q) || c.name_en.toLowerCase().includes(q))
  }, [cocktails, query])

  if (filtered.length === 0) return <EmptyState />

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
      {filtered.map(c => {
        const isDirty = prices[c.id] !== (c.selling_price != null ? String(c.selling_price) : '')

        return (
          <div
            key={c.id}
            className="rounded-2xl p-4 flex flex-col gap-3 overflow-hidden"
            style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${isDirty ? 'var(--bg-dark)' : 'var(--border)'}`,
            }}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
              {c.name_en && (
                <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.name_en}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>材料原価</span>
              <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>
                {c.total_cost != null ? `¥${Math.round(c.total_cost).toLocaleString()}` : '—'}
              </span>
            </div>

            <PriceRow
              label="販売価格"
              value={prices[c.id]}
              onChange={v => setPrices(prev => ({ ...prev, [c.id]: v }))}
              rateNode={<RateChip rate={cocktailRate(c.total_cost, prices[c.id])} />}
            />
          </div>
        )
      })}
    </div>
  )
}

/* ── メインコンポーネント ── */

const TABS: { id: Tab; label: string }[] = [
  { id: 'products',  label: '商品'       },
  { id: 'glasses',   label: 'グラスワイン' },
  { id: 'cocktails', label: 'カクテル'    },
]

export function PricingClient({
  products,
  glasses,
  cocktails,
}: {
  products:  ProductRow[]
  glasses:   GlassRow[]
  cocktails: CocktailRow[]
}) {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>('products')

  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(products.map(p => [p.id, p.selling_price != null ? String(p.selling_price) : '']))
  )
  const [shotPrices, setShotPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(products.map(p => [p.id, p.shot_price != null ? String(p.shot_price) : '']))
  )
  const [glassPrices, setGlassPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(glasses.map(g => [g.id, g.selling_price != null ? String(g.selling_price) : '']))
  )
  const [cocktailPrices, setCocktailPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(cocktails.map(c => [c.id, c.selling_price != null ? String(c.selling_price) : '']))
  )

  const [query,  setQuery]  = useState('')
  const [catFilter, setCat] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const categories = useMemo(() => {
    const seen = new Set<string>()
    return products
      .map(p => p.category_name)
      .filter((c): c is string => !!c && !seen.has(c) && !!seen.add(c))
  }, [products])

  const dirtyCount = useMemo(() => {
    if (activeTab === 'products') {
      return products.filter(p => {
        const origSell = p.selling_price != null ? String(p.selling_price) : ''
        const origShot = p.shot_price    != null ? String(p.shot_price)    : ''
        return prices[p.id] !== origSell || (p.is_spirits && shotPrices[p.id] !== origShot)
      }).length
    }
    if (activeTab === 'glasses') {
      return glasses.filter(g => glassPrices[g.id] !== (g.selling_price != null ? String(g.selling_price) : '')).length
    }
    return cocktails.filter(c => cocktailPrices[c.id] !== (c.selling_price != null ? String(c.selling_price) : '')).length
  }, [activeTab, products, prices, shotPrices, glasses, glassPrices, cocktails, cocktailPrices])

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setSaved(false)
    try {
      if (activeTab === 'products') {
        const sellItems = products
          .filter(p => prices[p.id] !== (p.selling_price != null ? String(p.selling_price) : ''))
          .map(p => { const v = parseFloat(prices[p.id]); return { id: p.id, selling_price: isNaN(v) ? null : v } })

        const shotItems = products
          .filter(p => p.is_spirits && shotPrices[p.id] !== (p.shot_price != null ? String(p.shot_price) : ''))
          .map(p => { const v = parseFloat(shotPrices[p.id]); return { id: p.id, shot_price: isNaN(v) ? null : v } })

        await Promise.all([
          sellItems.length > 0 ? bulkUpdateSellingPrices(sellItems) : Promise.resolve(),
          shotItems.length > 0 ? bulkUpdateShotPrices(shotItems)    : Promise.resolve(),
        ])
        if (sellItems.length > 0 || shotItems.length > 0) { setSaved(true); router.refresh() }

      } else if (activeTab === 'glasses') {
        const items = glasses
          .filter(g => glassPrices[g.id] !== (g.selling_price != null ? String(g.selling_price) : ''))
          .map(g => { const v = parseFloat(glassPrices[g.id]); return { id: g.id, selling_price: isNaN(v) ? null : v } })

        if (items.length > 0) { await bulkUpdateGlassPrices(items); setSaved(true); router.refresh() }

      } else {
        const items = cocktails
          .filter(c => cocktailPrices[c.id] !== (c.selling_price != null ? String(c.selling_price) : ''))
          .map(c => { const v = parseFloat(cocktailPrices[c.id]); return { id: c.id, selling_price: isNaN(v) ? null : v } })

        if (items.length > 0) { await bulkUpdateCocktailPrices(items); setSaved(true); router.refresh() }
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 pb-24">
      {/* タブバー */}
      <div
        className="filter-tabs flex w-full sm:w-fit mb-2 p-1 gap-1 rounded-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setQuery(''); setCat(null) }}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 h-9 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap"
            style={
              activeTab === tab.id
                ? { background: 'var(--bg-dark)', color: 'var(--text-invert)' }
                : { color: 'var(--text-secondary)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ツールバー */}
      <div className="flex flex-col gap-2">
        <div
          className="flex items-center gap-2 px-3 h-11 rounded-xl"
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

        {/* 商品タブのみカテゴリフィルター */}
        {activeTab === 'products' && (
          <div className="filter-tabs flex gap-2 flex-wrap">
            <button
              onClick={() => setCat(null)}
              className="h-9 px-3 rounded-xl text-xs font-medium transition-all"
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
                className="h-9 px-3 rounded-xl text-xs font-medium transition-all"
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
        )}
      </div>

      {/* フローティング保存ボタン */}
      <button
        onClick={handleSave}
        disabled={saving || dirtyCount === 0}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-lg transition-all disabled:opacity-0 disabled:pointer-events-none hover:opacity-90 active:scale-95"
        style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
      >
        <RiCheckFill size={16} />
        {saving ? '保存中...' : saved ? '保存しました' : `${dirtyCount}件を更新`}
      </button>

      {/* タブパネル */}
      {activeTab === 'products' && (
        <ProductsTab
          products={products}
          prices={prices}
          setPrices={setPrices}
          shotPrices={shotPrices}
          setShotPrices={setShotPrices}
          query={query}
          catFilter={catFilter}
        />
      )}
      {activeTab === 'glasses' && (
        <GlassesTab
          glasses={glasses}
          prices={glassPrices}
          setPrices={setGlassPrices}
          query={query}
        />
      )}
      {activeTab === 'cocktails' && (
        <CocktailsTab
          cocktails={cocktails}
          prices={cocktailPrices}
          setPrices={setCocktailPrices}
          query={query}
        />
      )}
    </div>
  )
}
