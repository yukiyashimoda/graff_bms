'use client'

import { useState, useMemo, useOptimistic, useTransition, useCallback, memo } from 'react'
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
import { recordStockTransaction, batchStockTransactions } from '@/app/admin/(protected)/stock/actions'

export type BatchInfo = {
  cost_price:   number
  quantity_rem: number
  received_at:  string
}

export type StockItem = {
  id:            string
  name:          string
  name_en:       string
  unit:          string
  category_name: string | null
  image_url:     string | null
  cost_price:    number | null
  quantity:      number
  min_quantity:  number
  batches:       BatchInfo[]
}

type PriceModal = {
  id:         string
  name:       string
  unit:       string
  cost_price: number | null
}

export function StockGrid({ items: initialItems }: { items: StockItem[] }) {
  const router  = useRouter()
  const [items,      setItems]      = useState<StockItem[]>(initialItems)
  const [deltas,     setDeltas]     = useState<Record<string, number>>({})
  const [query,      setQuery]      = useState('')
  const [lowOnly,    setLowOnly]    = useState(false)
  const [catFilter,  setCat]        = useState<string | null>(null)
  const [showList,   setShowList]   = useState(false)
  const [priceModal, setPriceModal] = useState<PriceModal | null>(null)

  const [isPending, startTransition] = useTransition()
  const [optimisticItems, applyOptimistic] = useOptimistic(
    items,
    (state, updates: { id: string; quantity: number }[]) =>
      state.map(item => {
        const upd = updates.find(u => u.id === item.id)
        return upd ? { ...item, quantity: upd.quantity } : item
      }),
  )

  const categories = useMemo(() => {
    const seen = new Set<string>()
    return items
      .map(i => i.category_name)
      .filter((c): c is string => !!c && !seen.has(c) && !!seen.add(c))
  }, [items])

  // ─── 安定したコールバック（useCallback で参照を固定し StockCard の無駄な再レンダリングを防ぐ） ───

  const handleAdjust = useCallback((id: string, amount: number) => {
    setDeltas(prev => {
      const next = (prev[id] ?? 0) + amount
      if (next === 0) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: next }
    })
  }, [])

  const handleReset = useCallback((id: string) => {
    setDeltas(prev => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }, [])

  const handlePriceIn = useCallback(async (
    id: string, qty: number, price: number, notes?: string,
  ) => {
    const { newQuantity } = await recordStockTransaction(id, 'in', qty, price, notes)
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, quantity: newQuantity, cost_price: price } : i
    ))
    router.refresh()
  }, [router])

  const handleOpenPriceModal = useCallback((item: PriceModal) => {
    setPriceModal(item)
  }, [])

  const handleCatClick = useCallback((cat: string | null) => {
    if (cat === null) {
      setCat(null)
    } else {
      setCat(prev => prev === cat ? null : cat)
    }
  }, [])

  // ────────────────────────────────────────────────────────────────────────────

  const pendingIds   = Object.keys(deltas)
  const pendingCount = pendingIds.length

  function handleSave() {
    if (isPending || pendingCount === 0) return

    const snapshot = { ...deltas }
    setDeltas({})

    startTransition(async () => {
      const optimisticUpdates = Object.entries(snapshot).map(([id, delta]) => ({
        id,
        quantity: (items.find(i => i.id === id)?.quantity ?? 0) + delta,
      }))
      applyOptimistic(optimisticUpdates)

      try {
        const { results } = await batchStockTransactions(
          Object.entries(snapshot).map(([id, delta]) => ({
            productId: id,
            type:      delta > 0 ? 'in' : 'out' as 'in' | 'out',
            quantity:  Math.abs(delta),
          }))
        )

        setItems(prev => prev.map(item => {
          const r = results.find(r => r.id === item.id)
          return r ? { ...item, quantity: r.newQuantity } : item
        }))
        router.refresh()
      } catch {
        // サーバーエラー時は楽観的更新を元に戻す
        setDeltas(snapshot)
        router.refresh()
      }
    })
  }

  const lowCount = optimisticItems.filter(i => (i.quantity + (deltas[i.id] ?? 0)) < i.min_quantity).length

  const filtered = useMemo(() => {
    return optimisticItems.filter(item => {
      if (lowOnly && item.quantity >= item.min_quantity) return false
      if (catFilter && item.category_name !== catFilter) return false
      if (!query) return true
      const q = query.toLowerCase()
      return (
        item.name.toLowerCase().includes(q) ||
        item.name_en.toLowerCase().includes(q) ||
        (item.category_name ?? '').toLowerCase().includes(q)
      )
    })
  }, [optimisticItems, query, lowOnly, catFilter])

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

        {/* カテゴリフィルター */}
        <div className="flex gap-2 flex-wrap">
          <CatBtn label="すべて" active={catFilter === null} cat={null} onCatClick={handleCatClick} />
          {categories.map(c => (
            <CatBtn key={c} label={c} active={catFilter === c} cat={c} onCatClick={handleCatClick} />
          ))}
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
              onAdjust={handleAdjust}
              onReset={handleReset}
              onOpenPriceModal={handleOpenPriceModal}
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
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <RiCheckFill size={14} />
            {isPending ? '保存中...' : '在庫を更新する'}
          </button>
        </div>
      )}

      {/* 変更内容モーダル */}
      {/* 価格改定モーダル */}
      {priceModal && (
        <PriceModalDialog
          item={priceModal}
          onClose={() => setPriceModal(null)}
          onPriceIn={async (id, qty, price, notes) => {
            await handlePriceIn(id, qty, price, notes)
            setPriceModal(null)
          }}
        />
      )}

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
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
              >
                <RiCheckFill size={14} />
                {isPending ? '保存中...' : '在庫を更新する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── カード ──────────────────────────────────────────────────────────────────

// memo: onAdjust/onReset/onPriceIn が useCallback で固定されているため、
// delta や item が変化しない限り再レンダリングをスキップする
const StockCard = memo(function StockCard({
  item, delta, onAdjust, onReset, onOpenPriceModal,
}: {
  item:               StockItem
  delta:              number
  onAdjust:           (id: string, amount: number) => void
  onReset:            (id: string) => void
  onOpenPriceModal:   (item: PriceModal) => void
}) {
  const newQty   = item.quantity + delta
  const isLow    = newQty < item.min_quantity && item.min_quantity > 0
  const hasDelta = delta !== 0
  const pct      = item.min_quantity > 0
    ? Math.min(100, Math.round((newQty / item.min_quantity) * 100))
    : 100

  return (
    <div
      className="stock-card flex flex-col rounded-2xl overflow-hidden"
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

        {/* カテゴリ */}
        <div>
          {item.category_name
            ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#102937', color: '#ededed' }}>{item.category_name}</span>
            : <span />
          }
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
          {isLow && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full pb-0.5" style={{ background: '#d84f2a', color: '#ededed' }}>
              不足
            </span>
          )}
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

        {/* ロット別在庫 / 仕入れ値 */}
        {item.batches.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {item.batches.map((b, i) => (
              <p key={i} className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                ¥{b.cost_price.toLocaleString()} × {b.quantity_rem}{item.unit}
              </p>
            ))}
          </div>
        ) : item.cost_price != null ? (
          <p className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
            ¥{item.cost_price.toLocaleString()} × {item.quantity}{item.unit}
          </p>
        ) : null}

        {/* 価格改定ボタン */}
        <div className="flex justify-end mt-auto pt-1">
          <button
            onClick={() => onOpenPriceModal({ id: item.id, name: item.name, unit: item.unit, cost_price: item.cost_price })}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-opacity hover:opacity-70"
            style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            価格改定
          </button>
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
          onClick={() => onAdjust(item.id, -1)}
          className="flex items-center justify-center py-3 transition-all hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)] active:scale-95"
          style={{ color: 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}
        >
          <RiSubtractFill size={15} />
        </button>

        {hasDelta && (
          <button
            onClick={() => onReset(item.id)}
            className="flex items-center justify-center px-3 py-3 text-[11px] font-semibold transition-all hover:bg-[var(--bg-base)] active:scale-95"
            style={{ color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}
          >
            戻す
          </button>
        )}

        <button
          onClick={() => onAdjust(item.id, 1)}
          className="flex items-center justify-center py-3 transition-all hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)] active:scale-95"
          style={{ color: 'var(--text-secondary)' }}
        >
          <RiAddFill size={15} />
        </button>
      </div>
    </div>
  )
})

// ─── 価格改定モーダル ─────────────────────────────────────────────────────────

function PriceModalDialog({
  item,
  onClose,
  onPriceIn,
}: {
  item:      PriceModal
  onClose:   () => void
  onPriceIn: (id: string, qty: number, price: number, notes?: string) => Promise<void>
}) {
  const [priceInput, setPriceInput] = useState(String(item.cost_price ?? ''))
  const [qtyInput,   setQtyInput]   = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  async function handleSubmit() {
    const price = parseFloat(priceInput)
    const qty   = parseFloat(qtyInput)
    if (isNaN(price) || price <= 0) { setError('仕入れ価格を入力してください'); return }
    if (isNaN(qty)   || qty   <= 0) { setError('入庫数を入力してください'); return }
    setSaving(true)
    setError(null)
    try {
      await onPriceIn(item.id, qty, price, notesInput || undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>価格改定 + 入庫</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-base)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <RiCloseFill size={17} />
          </button>
        </div>

        {/* フォーム */}
        <div className="px-5 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>仕入れ価格 *</label>
            <div
              className="flex items-center gap-2 px-3 h-12 rounded-xl"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
            >
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>¥</span>
              <input
                type="number" min="0" step="1"
                value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
                placeholder="例: 1200"
                className="flex-1 text-base tabular-nums outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>入庫数 *</label>
            <div
              className="flex items-center gap-2 px-3 h-12 rounded-xl"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
            >
              <input
                type="number" min="0" step="1"
                value={qtyInput}
                onChange={e => setQtyInput(e.target.value)}
                placeholder={`数量 (${item.unit})`}
                className="flex-1 text-base tabular-nums outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
              />
              <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{item.unit}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>備考（省略可）</label>
            <div
              className="flex items-center px-3 h-12 rounded-xl"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
            >
              <input
                type="text"
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                placeholder="例: 新しいロット"
                className="flex-1 text-base outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {error && <p className="text-xs" style={{ color: '#d84f2a' }}>{error}</p>}
        </div>

        {/* フッター */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
            style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
          >
            <RiCheckFill size={14} />
            {saving ? '保存中...' : '入庫・改定'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── カテゴリフィルターボタン ─────────────────────────────────────────────────

// memo: onCatClick が useCallback で固定されているため、active が変化しない限り再レンダリングをスキップ
const CatBtn = memo(function CatBtn({
  label, active, cat, onCatClick,
}: {
  label:      string
  active:     boolean
  cat:        string | null
  onCatClick: (cat: string | null) => void
}) {
  return (
    <button
      onClick={() => onCatClick(cat)}
      className="h-11 px-3 rounded-xl text-xs font-medium transition-all"
      style={{
        background: active ? 'var(--bg-dark)' : 'var(--bg-surface)',
        color:      active ? 'var(--text-invert)' : 'var(--text-secondary)',
        border:     active ? 'none' : '1px solid var(--border)',
      }}
    >
      {label}
    </button>
  )
})
