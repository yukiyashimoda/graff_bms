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
  RiFileListFill,
} from 'react-icons/ri'
import { createOrdersFromCart } from '@/app/admin/(protected)/orders/actions'

export type CartItem = {
  id:            string
  name:          string
  name_en:       string
  unit:          string
  cost_price:    number | null
  category_name: string | null
  supplier_id:   string | null
  supplier_name: string | null
  quantity:      number
  min_quantity:  number
}

export function OrderCart({ items }: { items: CartItem[] }) {
  const router = useRouter()
  const [cart,     setCart]     = useState<Record<string, number>>({})
  const [query,    setQuery]    = useState('')
  const [lowOnly,  setLowOnly]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [showList, setShowList] = useState(false)
  const [doneMsg,  setDoneMsg]  = useState<string | null>(null)

  function adjustCart(id: string, amount: number) {
    setCart(prev => {
      const next = Math.max(0, (prev[id] ?? 0) + amount)
      if (next === 0) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: next }
    })
  }

  const pendingIds   = Object.keys(cart)
  const pendingCount = pendingIds.length
  const lowCount     = items.filter(i => i.quantity < i.min_quantity && i.min_quantity > 0).length

  // 業者ごとにグループ化（モーダル表示用）
  const bySupplier = useMemo(() => {
    const map = new Map<string, { name: string; items: { item: CartItem; qty: number }[] }>()
    for (const id of pendingIds) {
      const item = items.find(i => i.id === id)!
      const key  = item.supplier_id ?? '__none__'
      const name = item.supplier_name ?? '発注先未設定'
      if (!map.has(key)) map.set(key, { name, items: [] })
      map.get(key)!.items.push({ item, qty: cart[id] })
    }
    return Array.from(map.entries())
  }, [pendingIds, items, cart])

  const totalAmount = pendingIds.reduce((s, id) => {
    const item = items.find(i => i.id === id)!
    return s + (item.cost_price ?? 0) * cart[id]
  }, 0)

  async function handleConfirm() {
    if (saving || pendingCount === 0) return
    setSaving(true)
    try {
      const cartItems = pendingIds
        .map(id => {
          const item = items.find(i => i.id === id)!
          return {
            product_id:  id,
            supplier_id: item.supplier_id ?? '',
            quantity:    cart[id],
            unit_price:  item.cost_price,
          }
        })
        .filter(i => i.supplier_id)  // 発注先なしは除外

      const { count } = await createOrdersFromCart(cartItems)
      setCart({})
      setShowList(false)
      setDoneMsg(`発注書を ${count} 件作成しました`)
      router.refresh()
      setTimeout(() => setDoneMsg(null), 4000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (lowOnly && item.quantity >= item.min_quantity) return false
      if (!query) return true
      const q = query.toLowerCase()
      return (
        item.name.toLowerCase().includes(q) ||
        item.name_en.toLowerCase().includes(q) ||
        (item.category_name ?? '').toLowerCase().includes(q) ||
        (item.supplier_name ?? '').toLowerCase().includes(q)
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
            placeholder="商品名・業者で検索..."
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
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))' }}>
          {filtered.map(item => (
            <OrderCard
              key={item.id}
              item={item}
              qty={cart[item.id] ?? 0}
              onAdjust={amount => adjustCart(item.id, amount)}
              onReset={() => {
                const { [item.id]: _, ...rest } = cart
                setCart(rest)
              }}
            />
          ))}
        </div>
      )}

      {/* フローティングバー */}
      {pendingCount > 0 && (
        <div
          className="fixed bottom-6 right-8 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
        >
          <button
            onClick={() => setShowList(true)}
            className="text-sm font-medium opacity-80 hover:opacity-100 transition-opacity underline underline-offset-2"
          >
            {pendingCount} 品目を発注中
          </button>
          <button
            onClick={() => setCart({})}
            className="text-xs opacity-50 hover:opacity-90 transition-opacity"
          >
            リセット
          </button>
          <button
            onClick={() => setShowList(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <RiFileListFill size={14} />
            {saving ? '作成中...' : '発注書を作成'}
          </button>
        </div>
      )}

      {/* 成功トースト */}
      {doneMsg && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2"
          style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
        >
          <RiCheckFill size={15} />
          {doneMsg}
        </div>
      )}

      {/* 確認モーダル */}
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
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>発注内容の確認</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {bySupplier.length} 業者に分けて発注書を作成します
                </p>
              </div>
              <button
                onClick={() => setShowList(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-base)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <RiCloseFill size={17} />
              </button>
            </div>

            {/* 業者ごとのグループ */}
            <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
              {bySupplier.map(([key, group]) => (
                <div key={key}>
                  {/* 業者ヘッダー */}
                  <div
                    className="px-5 py-2 flex items-center justify-between"
                    style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}
                  >
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{group.name}</p>
                    <p className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {group.items.length} 品目
                    </p>
                  </div>
                  {/* 品目 */}
                  {group.items.map(({ item, qty }) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-5 py-3"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          在庫 {item.quantity} {item.unit}
                          {item.cost_price != null && `  ¥${item.cost_price.toLocaleString()}/${item.unit}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          {qty} {item.unit}
                        </p>
                        {item.cost_price != null && (
                          <p className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            ¥{(item.cost_price * qty).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* 合計 + フッター */}
            <div className="px-5 py-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
              {totalAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>合計（仕入れ価格）</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setCart({}); setShowList(false) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  すべてリセット
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
                >
                  <RiCheckFill size={14} />
                  {saving ? '作成中...' : '発注書を作成'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── カード ──────────────────────────────────────────────────────────────────

function OrderCard({
  item, qty, onAdjust, onReset,
}: {
  item:     CartItem
  qty:      number
  onAdjust: (amount: number) => void
  onReset:  () => void
}) {
  const isLow    = item.quantity < item.min_quantity && item.min_quantity > 0
  const hasQty   = qty > 0
  const pct      = item.min_quantity > 0
    ? Math.min(100, Math.round((item.quantity / item.min_quantity) * 100))
    : 100

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border:     hasQty
          ? '1.5px solid var(--bg-dark)'
          : isLow
            ? '1.5px solid var(--text-muted)'
            : '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
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

        {/* 発注数 */}
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold tabular-nums leading-none" style={{ color: hasQty ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {hasQty ? qty : '—'}
          </span>
          {hasQty && <span className="text-[11px] pb-0.5" style={{ color: 'var(--text-muted)' }}>{item.unit}</span>}
        </div>

        {/* 在庫バー */}
        <div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: isLow ? 'var(--bg-dark)' : 'var(--text-muted)' }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>在庫 {item.quantity} {item.unit}</p>
            {item.cost_price != null && (
              <p className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>¥{item.cost_price.toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* 業者名 */}
        {item.supplier_name && (
          <p className="text-[10px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>
            {item.supplier_name}
          </p>
        )}
      </div>

      {/* ±ボタン */}
      <div
        className="grid border-t"
        style={{ borderColor: 'var(--border)', gridTemplateColumns: hasQty ? '1fr auto 1fr' : '1fr 1fr' }}
      >
        <button
          onClick={() => onAdjust(-1)}
          disabled={!hasQty}
          className="flex items-center justify-center py-3 transition-all hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)] active:scale-95 disabled:opacity-30"
          style={{ color: 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}
        >
          <RiSubtractFill size={15} />
        </button>

        {hasQty && (
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
