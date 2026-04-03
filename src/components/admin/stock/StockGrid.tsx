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
  RiFileListFill,
  RiShoppingCart2Fill,
  RiArrowDownSLine,
} from 'react-icons/ri'
import { recordStockTransaction, batchStockTransactions } from '@/app/admin/(protected)/stock/actions'
import { createOrdersFromCart } from '@/app/admin/(protected)/orders/actions'
import { getCategoryStyle } from '@/lib/categoryColor'

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
  supplier_id:   string | null
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

export function StockGrid({ items: initialItems, initialZeroFilter = false }: { items: StockItem[]; initialZeroFilter?: boolean }) {
  const router  = useRouter()
  const [items,      setItems]      = useState<StockItem[]>(initialItems)
  const [deltas,     setDeltas]     = useState<Record<string, number>>({})
  const [query,      setQuery]      = useState('')
  const [lowOnly,    setLowOnly]    = useState(false)
  const [zeroOnly,   setZeroOnly]   = useState(initialZeroFilter)
  const [catFilter,  setCat]        = useState<string | null>(null)
  const [showList,        setShowList]        = useState(false)
  const [priceModal,      setPriceModal]      = useState<PriceModal | null>(null)
  const [orderDone,       setOrderDone]       = useState(false)
  const [orderError,      setOrderError]      = useState<string | null>(null)
  const [orderSaving,     setOrderSaving]     = useState(false)
  const [deliveryModal,   setDeliveryModal]   = useState(false)
  const [deliveryDate,    setDeliveryDate]    = useState('')
  const [pendingCartItems, setPendingCartItems] = useState<{product_id:string;supplier_id:string|null;quantity:number;unit_price:number|null}[]>([])

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

  function handleAddToOrderList() {
    const cartItems = pendingIds
      .filter(id => (deltas[id] ?? 0) > 0)
      .map(id => {
        const item = items.find(i => i.id === id)!
        return {
          product_id:  id,
          supplier_id: item.supplier_id,
          quantity:    deltas[id],
          unit_price:  item.cost_price,
        }
      })
    if (cartItems.length === 0) return
    setPendingCartItems(cartItems)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setDeliveryDate(tomorrow.toISOString().slice(0, 10))
    setShowList(false)
    setDeliveryModal(true)
  }

  async function submitOrderWithDate(_date: string | null) {
    setDeliveryModal(false)
    setOrderSaving(true)
    setOrderError(null)
    try {
      await createOrdersFromCart(pendingCartItems.map(c => ({ ...c, supplier_id: c.supplier_id ?? '' })))
      setDeltas(prev => {
        const next = { ...prev }
        pendingCartItems.forEach(c => { delete next[c.product_id] })
        return next
      })
      setPendingCartItems([])
      setOrderDone(true)
      setTimeout(() => setOrderDone(false), 3000)
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : '発注リストへの追加に失敗しました')
    } finally {
      setOrderSaving(false)
    }
  }

  const lowCount = optimisticItems.filter(i => (i.quantity + (deltas[i.id] ?? 0)) < i.min_quantity).length

  const filtered = useMemo(() => {
    return optimisticItems.filter(item => {
      if (zeroOnly && item.quantity !== 0) return false
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
  }, [optimisticItems, query, lowOnly, zeroOnly, catFilter])

  return (
    <>
      {/* ツールバー */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* 検索 + カテゴリドロップダウン */}
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <RiSearchLine size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="商品名・カテゴリで検索..."
              className="w-full appearance-none rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', height: '40px', paddingLeft: '32px', paddingRight: '12px', boxSizing: 'border-box' }}
            />
          </div>

          {categories.length > 0 && (
            <div className="relative sm:w-44">
              <select
                value={catFilter ?? ''}
                onChange={e => setCat(e.target.value || null)}
                className="w-full appearance-none pl-3 pr-8 rounded-xl text-sm outline-none cursor-pointer"
                style={{ background: 'var(--bg-surface)', color: catFilter ? 'var(--text-primary)' : 'var(--text-secondary)', border: '1px solid var(--border)', height: '40px' }}
              >
                <option value="" style={{ background: '#0c141c', color: '#e7eef9' }}>すべてのカテゴリ</option>
                {categories.map(c => (
                  <option key={c} value={c} style={{ background: '#0c141c', color: '#e7eef9' }}>{c}</option>
                ))}
              </select>
              <RiArrowDownSLine size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          )}
        </div>

        {/* 在庫なしのみ */}
        <button
          onClick={() => setZeroOnly(v => !v)}
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-all"
          style={{
            background: zeroOnly ? 'rgba(255,113,108,0.12)' : 'var(--bg-surface)',
            color:      zeroOnly ? '#ff716c' : 'var(--text-secondary)',
            border:     zeroOnly ? '1px solid rgba(255,113,108,0.3)' : '1px solid var(--border)',
          }}
        >
          <RiAlertFill size={13} />
          在庫なし
        </button>

        {/* 在庫不足のみ（独立） */}
        <button
          onClick={() => setLowOnly(v => !v)}
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-all"
          style={{
            background: lowOnly ? 'rgba(129,236,255,0.12)' : 'var(--bg-surface)',
            color:      lowOnly ? '#81ecff' : 'var(--text-secondary)',
            border:     lowOnly ? 'none' : '1px solid var(--border)',
          }}
        >
          <RiAlertFill size={13} />
          在庫不足のみ
          {lowCount > 0 && (
            <span
              className="ml-0.5 text-[11px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: lowOnly ? 'rgba(255,255,255,0.2)' : 'rgba(129,236,255,0.12)', color: '#81ecff' }}
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
            />
          ))}
        </div>
      )}

      {/* カート FAB */}
      {pendingCount > 0 && (
        <button
          onClick={() => setShowList(true)}
          className="fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-40 flex items-center gap-2 pl-4 pr-5 rounded-full active:scale-95 transition-transform"
          style={{
            height:     '56px',
            background: 'rgba(17,17,17,0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border:     '1px solid rgba(129,236,255,0.35)',
            boxShadow:  '0 0 20px rgba(129,236,255,0.2), 0 8px 32px rgba(0,0,0,0.4)',
            color:      '#81ecff',
          }}
        >
          <RiShoppingCart2Fill size={22} />
          <span
            className="text-sm font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.02em' }}
          >
            {pendingCount}
          </span>
        </button>
      )}

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

      {/* 納品希望日モーダル */}
      {deliveryModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => { setDeliveryModal(false); setShowList(true) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>納品希望日</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>発注書に印刷されます</p>
            </div>

            <div className="px-5 py-5">
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full px-3 rounded-xl text-sm outline-none tabular-nums"
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  height: '44px',
                  colorScheme: 'dark',
                }}
              />
            </div>

            <div className="flex flex-col gap-2 px-5 pb-5">
              <button
                onClick={() => submitOrderWithDate(deliveryDate || null)}
                disabled={orderSaving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
              >
                <RiCheckFill size={14} />
                {orderSaving ? '追加中...' : '発注リストに追加'}
              </button>
              <button
                onClick={() => submitOrderWithDate(null)}
                disabled={orderSaving}
                className="w-full py-2.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ color: 'var(--text-muted)' }}
              >
                日付を指定せずに追加
              </button>
            </div>
          </div>
        </div>
      )}

      {orderDone && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
          style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
        >
          <RiCheckFill size={15} />
          発注リストに追加しました
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

            <div className="flex flex-col gap-2 px-4 py-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {pendingIds.map(id => {
                const item   = items.find(i => i.id === id)!
                const delta  = deltas[id]
                const newQty = item.quantity + delta
                return (
                  <div
                    key={id}
                    className="flex flex-col gap-1.5 px-4 py-3 rounded-xl"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.name}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {item.category_name ?? '—'}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center tabular-nums text-xs flex-1 min-w-0">
                        <span style={{ color: 'var(--text-muted)' }}>{item.quantity}</span>
                        <span className="mx-1" style={{ color: 'var(--text-muted)' }}>→</span>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{newQty}</span>
                        <span
                          className="font-bold ml-5"
                          style={{ color: delta > 0 ? 'var(--success)' : 'var(--danger)' }}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                        <span className="ml-0.5" style={{ color: 'var(--text-muted)' }}>{item.unit}</span>
                        {item.cost_price != null && (
                          <span className="ml-4" style={{ color: 'var(--text-muted)' }}>
                            ¥{item.cost_price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setShowList(false)
                          handleOpenPriceModal({ id: item.id, name: item.name, unit: item.unit, cost_price: item.cost_price })
                        }}
                        className="btn-inline flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70"
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      >
                        価格改定
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div
              className="px-5 py-4 space-y-2"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowList(false); handleSave() }}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
                >
                  <RiCheckFill size={14} />
                  {isPending ? '保存中...' : '在庫を更新する'}
                </button>
                <button
                  onClick={handleAddToOrderList}
                  disabled={orderSaving || pendingIds.every(id => (deltas[id] ?? 0) <= 0)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  <RiFileListFill size={14} />
                  {orderSaving ? '追加中...' : '発注リストに追加'}
                </button>
              </div>
              {orderError && (
                <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>{orderError}</p>
              )}
              <button
                onClick={() => { setDeltas({}); setShowList(false) }}
                className="w-full py-2 text-xs rounded-xl transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                すべてリセット
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── カード ──────────────────────────────────────────────────────────────────

const StockCard = memo(function StockCard({
  item, delta, onAdjust, onReset,
}: {
  item:     StockItem
  delta:    number
  onAdjust: (id: string, amount: number) => void
  onReset:  (id: string) => void
}) {
  const newQty   = item.quantity + delta
  const isLow    = newQty < item.min_quantity && item.min_quantity > 0
  const hasDelta = delta !== 0

  return (
    <div
      className="stock-card flex flex-col rounded-xl overflow-hidden"
      style={{
        background:     'rgba(18, 26, 34, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border:     hasDelta
          ? '1px solid rgba(129,236,255,0.35)'
          : isLow
            ? '1.5px solid rgba(255,113,108,0.5)'
            : '1px solid rgba(129,236,255,0.1)',
      }}
    >
      <div className="px-4 pt-4 pb-3 flex flex-col gap-2.5 flex-1">

        {/* カテゴリ */}
        <div>
          {item.category_name
            ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={getCategoryStyle(item.category_name)}>{item.category_name}</span>
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
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full pb-0.5" style={{ background: 'var(--danger)', color: '#81ecff' }}>
              不足
            </span>
          )}
          {hasDelta && (
            <span
              className="ml-auto text-sm font-bold tabular-nums"
              style={{ color: delta > 0 ? 'var(--success)' : 'var(--danger)' }}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>

        {/* ドットプログレスバー + 最低在庫 */}
        {item.min_quantity > 0 && (() => {
          const SEGMENTS = 24
          const filled = Math.round(Math.min(SEGMENTS, Math.max(0, (newQty / item.min_quantity) * SEGMENTS)))
          const color  = isLow ? 'var(--danger)' : '#81ecff'
          const glow   = isLow ? '0 0 3px rgba(255,113,108,0.8)' : '0 0 3px rgba(129,236,255,0.8)'
          return (
            <div className="space-y-1">
              <div className="flex gap-[2px] items-center">
                {Array.from({ length: SEGMENTS }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex:        1,
                      aspectRatio: '1 / 1',
                      borderRadius:'1px',
                      background:  i < filled ? color : 'rgba(255,255,255,0.07)',
                      boxShadow:   i < filled ? glow : 'none',
                      transition:  'background 0.2s, box-shadow 0.2s',
                    }}
                  />
                ))}
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                最低 {item.min_quantity} {item.unit}
              </p>
            </div>
          )
        })()}

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

      </div>

      {/* ±ボタン */}
      <div
        className="grid border-t"
        style={{
          borderColor:         'rgba(129,236,255,0.12)',
          gridTemplateColumns: hasDelta ? '1fr auto 1fr' : '1fr 1fr',
        }}
      >
        <button
          onClick={() => onAdjust(item.id, -1)}
          className="flex items-center justify-center py-3 transition-all hover:bg-[rgba(129,236,255,0.12)] hover:text-[#81ecff] active:scale-95"
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
          className="flex items-center justify-center py-3 transition-all hover:bg-[rgba(129,236,255,0.12)] hover:text-[#81ecff] active:scale-95"
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

          {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
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
            style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
          >
            <RiCheckFill size={14} />
            {saving ? '保存中...' : '入庫・改定'}
          </button>
        </div>
      </div>
    </div>
  )
}
