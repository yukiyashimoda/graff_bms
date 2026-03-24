'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  RiAddFill,
  RiSubtractFill,
  RiAlertFill,
  RiSearchLine,
  RiArchiveFill,
  RiCheckFill,
  RiCloseFill,
} from 'react-icons/ri'
import { recordStockTransaction } from '@/app/admin/(protected)/stock/actions'

export type StockItem = {
  id:            string
  name:          string
  name_en:       string
  unit:          string
  category_name: string | null
  image_url:     string | null
  quantity:      number
  min_quantity:  number
}

export function StockGrid({ items: initialItems }: { items: StockItem[] }) {
  const router  = useRouter()
  const [items,   setItems]   = useState<StockItem[]>(initialItems)
  const [deltas,  setDeltas]  = useState<Record<string, number>>({})
  const [query,   setQuery]   = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [showList, setShowList] = useState(false)

  function adjustDelta(id: string, amount: number) {
    setDeltas(prev => {
      const next = (prev[id] ?? 0) + amount
      if (next === 0) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: next }
    })
  }

  const pendingIds    = Object.keys(deltas)
  const pendingCount  = pendingIds.length

  async function handleSave() {
    if (saving || pendingCount === 0) return
    setSaving(true)
    try {
      const results: Record<string, number> = {}
      await Promise.all(
        pendingIds.map(async id => {
          const delta = deltas[id]
          const { newQuantity } = await recordStockTransaction(
            id,
            delta > 0 ? 'in' : 'out',
            Math.abs(delta),
          )
          results[id] = newQuantity
        })
      )
      setItems(prev => prev.map(item =>
        results[item.id] !== undefined ? { ...item, quantity: results[item.id] } : item
      ))
      setDeltas({})
      router.refresh()
    } catch (e) {
      console.error('在庫更新エラー:', e)
    } finally {
      setSaving(false)
    }
  }

  const lowCount = items.filter(i => (i.quantity + (deltas[i.id] ?? 0)) < i.min_quantity).length

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (lowOnly && item.quantity >= item.min_quantity) return false
      if (!query) return true
      const q = query.toLowerCase()
      return (
        item.name.toLowerCase().includes(q) ||
        item.name_en.toLowerCase().includes(q) ||
        (item.category_name ?? '').toLowerCase().includes(q)
      )
    })
  }, [items, query, lowOnly])

  return (
    <>
      {/* ツールバー */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 h-10 rounded-xl flex-1 min-w-40"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <RiSearchLine size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="商品名・カテゴリで検索..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <button
          onClick={() => setLowOnly(v => !v)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-all"
          style={{
            background: lowOnly ? 'var(--bg-dark)' : 'var(--bg-surface)',
            color:      lowOnly ? 'var(--text-invert)' : 'var(--text-secondary)',
            border:     lowOnly ? 'none' : '1px solid var(--border)',
          }}
        >
          <RiAlertFill size={13} />
          在庫不足のみ
          {lowCount > 0 && (
            <span
              className="ml-0.5 text-[11px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: lowOnly ? 'rgba(255,255,255,0.2)' : 'var(--bg-dark)', color: 'var(--text-invert)' }}
            >
              {lowCount}
            </span>
          )}
        </button>
      </div>

      {/* グリッド */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-2xl gap-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <RiArchiveFill size={28} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {lowOnly ? '在庫不足の商品はありません' : '該当する商品がありません'}
          </p>
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))' }}
        >
          {filtered.map(item => (
            <StockCard
              key={item.id}
              item={item}
              delta={deltas[item.id] ?? 0}
              onAdjust={amount => adjustDelta(item.id, amount)}
              onReset={() => {
                const { [item.id]: _, ...rest } = deltas
                setDeltas(rest)
              }}
            />
          ))}
        </div>
      )}

      {/* 変更確認バー */}
      {pendingCount > 0 && (
        <div
          className="fixed bottom-6 right-8 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{
            background: 'var(--bg-dark)',
            color:      'var(--text-invert)',
            boxShadow:  '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <button
            onClick={() => setShowList(true)}
            className="text-sm font-medium opacity-80 hover:opacity-100 transition-opacity underline underline-offset-2"
          >
            {pendingCount} 品目を変更中
          </button>
          <button
            onClick={() => setDeltas({})}
            className="text-xs opacity-50 hover:opacity-90 transition-opacity"
          >
            リセット
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <RiCheckFill size={14} />
            {saving ? '保存中...' : '在庫を更新する'}
          </button>
        </div>
      )}

      {/* 変更内容モーダル */}
      {showList && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowList(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                変更内容の確認
              </p>
              <button
                onClick={() => setShowList(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-base)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <RiCloseFill size={17} />
              </button>
            </div>

            {/* 一覧 */}
            <div className="divide-y" style={{ maxHeight: '60vh', overflowY: 'auto', borderColor: 'var(--border)' }}>
              {pendingIds.map(id => {
                const item  = items.find(i => i.id === id)!
                const delta = deltas[id]
                const newQty = item.quantity + delta
                return (
                  <div key={id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.name}
                      </p>
                      {item.category_name && (
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.category_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 tabular-nums text-sm shrink-0">
                      <span style={{ color: 'var(--text-muted)' }}>{item.quantity}</span>
                      <span style={{ color: 'var(--text-muted)' }}>→</span>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{newQty}</span>
                      <span
                        className="text-xs font-bold w-10 text-right"
                        style={{ color: delta > 0 ? '#22c55e' : '#f87171' }}
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.unit}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* フッター */}
            <div
              className="flex gap-3 px-5 py-4"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <button
                onClick={() => { setDeltas({}); setShowList(false) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                すべてリセット
              </button>
              <button
                onClick={() => { setShowList(false); handleSave() }}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
              >
                <RiCheckFill size={14} />
                {saving ? '保存中...' : '在庫を更新する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── カード ──────────────────────────────────────────────────────────────────

function StockCard({
  item, delta, onAdjust, onReset,
}: {
  item:     StockItem
  delta:    number
  onAdjust: (amount: number) => void
  onReset:  () => void
}) {
  const newQty   = item.quantity + delta
  const isLow    = newQty < item.min_quantity && item.min_quantity > 0
  const hasDelta = delta !== 0
  const pct      = item.min_quantity > 0
    ? Math.min(100, Math.round((newQty / item.min_quantity) * 100))
    : 100

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border:     hasDelta
          ? '1.5px solid var(--bg-dark)'
          : isLow
            ? '1.5px solid var(--text-muted)'
            : '1px solid var(--border)',
        boxShadow:  'var(--shadow-sm)',
      }}
    >
      <div className="px-4 pt-4 pb-3 flex flex-col gap-2.5 flex-1">

        {/* カテゴリ + 不足バッジ */}
        <div className="flex items-center justify-between gap-1">
          {item.category_name
            ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>{item.category_name}</span>
            : <span />
          }
          {isLow && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}>不足</span>
          )}
        </div>

        {/* 商品名 */}
        <div>
          <p className="text-[13px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
          {item.name_en && (
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.name_en}</p>
          )}
        </div>

        {/* 在庫数 */}
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold tabular-nums leading-none" style={{ color: 'var(--text-primary)' }}>
            {newQty}
          </span>
          <span className="text-[11px] pb-0.5" style={{ color: 'var(--text-muted)' }}>{item.unit}</span>
          {hasDelta && (
            <span
              className="ml-auto text-sm font-bold tabular-nums"
              style={{ color: delta > 0 ? '#22c55e' : '#f87171' }}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>

        {/* プログレスバー */}
        <div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: isLow ? 'var(--bg-dark)' : 'var(--text-muted)' }}
            />
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>最低 {item.min_quantity} {item.unit}</p>
        </div>
      </div>

      {/* ±ボタン */}
      <div
        className="grid border-t"
        style={{
          borderColor:         'var(--border)',
          gridTemplateColumns: hasDelta ? '1fr auto 1fr' : '1fr 1fr',
        }}
      >
        <button
          onClick={() => onAdjust(-1)}
          className="flex items-center justify-center py-3 transition-all hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)] active:scale-95"
          style={{ color: 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}
        >
          <RiSubtractFill size={15} />
        </button>

        {hasDelta && (
          <button
            onClick={onReset}
            className="flex items-center justify-center px-3 py-3 text-[11px] font-semibold transition-all hover:bg-[var(--bg-base)] active:scale-95"
            style={{ color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}
          >
            戻す
          </button>
        )}

        <button
          onClick={() => onAdjust(1)}
          className="flex items-center justify-center py-3 transition-all hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)] active:scale-95"
          style={{ color: 'var(--text-secondary)' }}
        >
          <RiAddFill size={15} />
        </button>
      </div>
    </div>
  )
}
