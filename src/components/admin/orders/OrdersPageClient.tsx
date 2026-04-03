'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  RiPrinterFill,
  RiDeleteBinFill,
  RiFileListLine,
  RiCloseFill,
  RiFileCopyLine,
  RiCheckLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from 'react-icons/ri'
import { SupplierManager } from '@/components/admin/suppliers/SupplierManager'
import {
  updateOrderStatus,
  deleteOrder,
  updateItemInspectionStatus,
  receiveOrderItem,
} from '@/app/admin/(protected)/orders/actions'
import type { IssuerProfile } from '@/app/admin/(protected)/orders/issuer-actions'

type InspectionStatus = 'arrived' | 'partial' | 'missing' | 'price_changed' | null

type Tab = 'history' | 'suppliers'

type Supplier = {
  id:           string
  name:         string
  name_en:      string
  contact_name: string | null
  phone:        string | null
  address:      string | null
  notes:        string | null
}

type OrderStatus = 'draft' | 'sent' | 'received' | 'cancelled'

type OrderItem = {
  id:                string
  quantity:          number
  unit_price:        number | null
  received_quantity: number
  product_name:      string
  product_unit:      string
  inspection_status: InspectionStatus
}

type Order = {
  id:            string
  status:        OrderStatus
  order_date:    string
  expected_date: string | null
  created_at:    string
  notes:         string | null
  supplier_name: string | null
  items:         OrderItem[]
}

// ─── モーダル型 ──────────────────────────────────────────────
type PartialModal = {
  orderId:         string
  itemId:          string
  productName:     string
  unit:            string
  remaining:       number
  currentReceived: number
  isPriceChange:   boolean
  newPrice:        number | null
}

type PriceModal = {
  orderId:         string
  itemId:          string
  productName:     string
  unit:            string
  remaining:       number
  currentReceived: number
  originalPrice:   number | null
}

// ─── ステータス表示 ───────────────────────────────────────────
const STATUS_LABEL: Record<OrderStatus, string> = {
  draft:     '下書き',
  sent:      '送付済み',
  received:  '受領済み',
  cancelled: 'キャンセル',
}
const STATUS_STYLE: Record<OrderStatus, React.CSSProperties> = {
  draft:     { background: 'var(--bg-base)',  color: 'var(--text-secondary)', border: '1px solid var(--border)' },
  sent:      { background: 'var(--bg-base)',  color: 'var(--text-primary)',   border: '1px solid var(--border)' },
  received:  { background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' },
  cancelled: { background: 'var(--bg-base)',  color: 'var(--text-muted)',     border: '1px solid var(--border)' },
}

// ─── 検品ボタン定義 ───────────────────────────────────────────
const INSP_BTNS = [
  { key: 'arrived',       label: '受領',     active: { background: 'var(--success)', color: '#fff', border: '1px solid var(--success)' } },
  { key: 'partial',       label: '一部到着', active: { background: 'var(--danger)',  color: '#fff', border: '1px solid var(--danger)'  } },
  { key: 'missing',       label: '終売',     active: { background: '#6b7280',        color: '#fff', border: '1px solid #4b5563'        } },
  { key: 'price_changed', label: '価格改定', active: { background: '#8b5cf6',        color: '#fff', border: '1px solid #7c3aed'        } },
] as const

const idle: React.CSSProperties = {
  background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)',
}

// ─── コンポーネント ────────────────────────────────────────────
export function OrdersPageClient({
  orders: initialOrders,
  suppliers,
  orderTextTemplate,
}: {
  orders:             Order[]
  suppliers:          Supplier[]
  issuerProfile:      IssuerProfile
  orderTextTemplate:  string
}) {
  const [tab,       setTab]      = useState<Tab>('history')
  const [orders,    setOrders]   = useState<Order[]>(initialOrders)
  const [copiedId,  setCopiedId] = useState<string | null>(null)

  // 月別フィルター（デフォルト: 今月）
  const todayMonth = new Date().toISOString().slice(0, 7) // "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState(todayMonth)

  function shiftMonth(delta: number) {
    const [y, m] = selectedMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthLabel = (() => {
    const [y, m] = selectedMonth.split('-')
    return `${y}年${Number(m)}月`
  })()

  const filteredOrders = useMemo(
    () => orders.filter(o => o.order_date.startsWith(selectedMonth)),
    [orders, selectedMonth],
  )

  // Sync when server re-renders with fresh data
  useEffect(() => { setOrders(initialOrders) }, [initialOrders])
  const [textModal, setTextModal] = useState<{ text: string } | null>(null)

  function generateOrderText(order: Order): string {
    const itemLines = order.items
      .map(i => `・${i.product_name}：${i.quantity}${i.product_unit}`)
      .join('\n')

    let deliveryLine = '【納品希望日】\n'
    if (order.expected_date) {
      const d    = new Date(order.expected_date)
      const days = ['日', '月', '火', '水', '木', '金', '土']
      deliveryLine += ` ${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）15:00〜18:00`
    }

    return orderTextTemplate
      .replace('{{items}}', itemLines)
      .replace('{{delivery}}', deliveryLine)
  }

  function handleOpenTextModal(order: Order) {
    setTextModal({ text: generateOrderText(order) })
  }

  function handleCopyFromModal() {
    if (!textModal) return
    navigator.clipboard.writeText(textModal.text)
    setCopiedId('modal')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // モーダル
  const [partialModal, setPartialModal] = useState<PartialModal | null>(null)
  const [priceModal,   setPriceModal]   = useState<PriceModal | null>(null)
  const [inputQty,     setInputQty]     = useState('')
  const [inputPrice,   setInputPrice]   = useState('')

  // ─── オーダー操作 ─────────────────────────────────────────
  async function handleStatusUpdate(orderId: string, status: OrderStatus) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    await updateOrderStatus(orderId, status)
  }

  async function handleDelete(orderId: string) {
    setOrders(prev => prev.filter(o => o.id !== orderId))
    await deleteOrder(orderId)
  }

  // ─── 品目の楽観的更新ヘルパー ─────────────────────────────
  function patchItem(orderId: string, itemId: string, patch: Partial<OrderItem>) {
    setOrders(prev => prev.map(o =>
      o.id !== orderId ? o : {
        ...o,
        items: o.items.map(i => i.id !== itemId ? i : { ...i, ...patch }),
      }
    ))
  }

  function markOrderReceived(orderId: string) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'received' } : o))
  }

  // ─── 到着（全量） ─────────────────────────────────────────
  function handleArrived(order: Order, item: OrderItem) {
    const remaining = item.quantity - item.received_quantity
    if (remaining <= 0) return
    patchItem(order.id, item.id, { inspection_status: 'arrived', received_quantity: item.quantity })
    receiveOrderItem(item.id, remaining, null, false).then(({ fullyReceived }) => {
      if (fullyReceived && order.items.every(i => i.id === item.id || i.inspection_status === 'arrived')) {
        markOrderReceived(order.id)
      }
    })
  }

  // ─── 欠品 ────────────────────────────────────────────────
  function handleMissing(orderId: string, itemId: string) {
    patchItem(orderId, itemId, { inspection_status: 'missing' })
    void updateItemInspectionStatus(itemId, 'missing')
  }

  // ─── 一部到着ポップアップを開く ───────────────────────────
  function openPartial(order: Order, item: OrderItem, isPriceChange = false, newPrice: number | null = null) {
    setInputQty('')
    setPartialModal({
      orderId:         order.id,
      itemId:          item.id,
      productName:     item.product_name,
      unit:            item.product_unit,
      remaining:       item.quantity - item.received_quantity,
      currentReceived: item.received_quantity,
      isPriceChange,
      newPrice,
    })
  }

  // ─── 一部到着確定 ─────────────────────────────────────────
  function confirmPartial() {
    if (!partialModal) return
    const qty = Number(inputQty)
    if (!qty || qty <= 0 || qty > partialModal.remaining) return
    const newReceived = partialModal.currentReceived + qty
    patchItem(partialModal.orderId, partialModal.itemId, {
      inspection_status: 'partial',
      received_quantity: newReceived,
    })
    const snap = { ...partialModal }
    setPartialModal(null)
    void receiveOrderItem(snap.itemId, qty, snap.newPrice, snap.isPriceChange)
  }

  // ─── 価格改定ポップアップを開く ───────────────────────────
  function openPriceChange(order: Order, item: OrderItem) {
    setInputPrice(item.unit_price != null ? String(item.unit_price) : '')
    setInputQty('')
    setPriceModal({
      orderId:         order.id,
      itemId:          item.id,
      productName:     item.product_name,
      unit:            item.product_unit,
      remaining:       item.quantity - item.received_quantity,
      currentReceived: item.received_quantity,
      originalPrice:   item.unit_price,
    })
  }

  // 価格改定 → 到着（全量）
  function confirmPriceFull() {
    if (!priceModal) return
    const price = Number(inputPrice)
    if (!price || price <= 0) return
    const snap = { ...priceModal }
    setPriceModal(null)
    patchItem(snap.orderId, snap.itemId, { inspection_status: 'arrived', unit_price: price })
    void receiveOrderItem(snap.itemId, snap.remaining, price, true)
  }

  // 価格改定 → 一部到着（部分モーダルへ）
  function confirmPriceToPartial() {
    if (!priceModal) return
    const price = Number(inputPrice)
    if (!price || price <= 0) return
    const snap = { ...priceModal }
    setPriceModal(null)
    // 一部到着モーダルを価格改定フラグ付きで開く
    setInputQty('')
    setPartialModal({
      orderId:         snap.orderId,
      itemId:          snap.itemId,
      productName:     snap.productName,
      unit:            snap.unit,
      remaining:       snap.remaining,
      currentReceived: snap.currentReceived,
      isPriceChange:   true,
      newPrice:        price,
    })
  }

  // ─── タブ ─────────────────────────────────────────────────
  const TABS: { key: Tab; label: string }[] = [
    { key: 'history',   label: '発注リスト' },
    { key: 'suppliers', label: '発注先一覧' },
  ]

  return (
    <div className="max-w-5xl space-y-6">

      {/* ─── ヘッダー + タブ（PC） ─── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-bitcount, system-ui)' }}>ORDERS</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {tab === 'history'   && `発注 ${filteredOrders.length} 件`}
            {tab === 'suppliers' && `発注先 ${suppliers.length} 件`}
          </p>
        </div>
        <div
          className="hidden sm:flex rounded-xl overflow-hidden flex-shrink-0"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 text-sm font-medium transition-all"
              style={{
                background: tab === t.key ? 'rgba(129,236,255,0.12)' : 'transparent',
                color:      tab === t.key ? '#81ecff' : 'var(--text-secondary)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* タブ（スマホ全幅） */}
      <div
        className="flex sm:hidden w-full rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? 'rgba(129,236,255,0.12)' : 'transparent',
              color:      tab === t.key ? '#81ecff' : 'var(--text-secondary)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── 発注リスト ─── */}
      {tab === 'history' && (
        <div className="space-y-3">
          {/* 月ナビ */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              商品到着時はこちらから検品してください
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => shiftMonth(-1)}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <RiArrowLeftSLine size={16} />
              </button>
              <span
                className="text-xs font-semibold tabular-nums px-2"
                style={{ color: 'var(--text-primary)', minWidth: 72, textAlign: 'center' }}
              >
                {monthLabel}
              </span>
              <button
                onClick={() => shiftMonth(1)}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface)]"
                style={{ color: selectedMonth >= todayMonth ? 'var(--text-muted)' : 'var(--text-muted)', opacity: selectedMonth >= todayMonth ? 0.3 : 1 }}
                disabled={selectedMonth >= todayMonth}
              >
                <RiArrowRightSLine size={16} />
              </button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-24 rounded-2xl gap-3"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <RiFileListLine size={28} style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>この月の発注履歴がありません</p>
            </div>
          ) : filteredOrders.map(order => (
            <div
              key={order.id}
              className="rounded-2xl overflow-hidden relative"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              {/* 削除ボタン（下書きのみ・右上絶対配置） */}
              {order.status === 'draft' && (
                <button
                  onClick={() => handleDelete(order.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-base)]"
                  style={{ color: 'var(--text-muted)' }}
                  title="削除"
                >
                  <RiDeleteBinFill size={14} />
                </button>
              )}

              {/* オーダーヘッダー */}
              <div
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 pr-10"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {order.supplier_name ?? '発注先不明'}
                    </p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  {order.status !== 'draft' && (
                    <span
                      className="flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-medium"
                      style={STATUS_STYLE[order.status]}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {order.order_date}
                  </span>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => handleOpenTextModal(order)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5 active:bg-white/10"
                      style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                    >
                      <RiFileCopyLine size={13} />
                      テキスト
                    </button>
                    <a
                      href={`/admin/orders/${order.id}/print`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5 active:bg-white/10"
                      style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', textDecoration: 'none' }}
                    >
                      <RiPrinterFill size={13} />
                      発注書
                    </a>
                  </div>
                </div>
              </div>

              {/* 品目リスト */}
              <div className="flex flex-col gap-2 px-4 py-3">
                {order.items.map(item => {
                  const remaining  = item.quantity - item.received_quantity
                  const isArrived  = item.inspection_status === 'arrived'

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl"
                      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                    >

                      {/* 左: 本数 / 残本数 */}
                      <div className="flex-shrink-0 w-14 text-center">
                        {isArrived ? (
                          <>
                            <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'var(--success)' }}>
                              {item.quantity}
                            </p>
                            <p className="text-[10px] mt-0.5 font-medium" style={{ color: 'var(--success)' }}>完了</p>
                          </>
                        ) : item.inspection_status === 'missing' ? (
                          <>
                            <p className="text-lg font-bold leading-none" style={{ color: '#6b7280' }}>終売</p>
                          </>
                        ) : item.inspection_status === 'partial' ? (
                          <>
                            <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'var(--danger)' }}>
                              {remaining}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--danger)' }}>残 {item.product_unit}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'var(--text-primary)' }}>
                              {item.quantity}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.product_unit}</p>
                          </>
                        )}
                      </div>

                      {/* 右: 3段 */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* 1段目: 商品名 */}
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {item.product_name}
                        </p>

                        {/* 2段目: 単価 */}
                        <p className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {item.unit_price != null
                            ? `¥${item.unit_price.toLocaleString()} / ${item.product_unit}`
                            : '単価未設定'}
                        </p>

                        {/* 3段目: 検品ボタン（受領完了・終売時は非表示） */}
                        {!isArrived && item.inspection_status !== 'missing' && (
                          <div className="flex flex-col gap-1.5">
                            {/* 受領ボタン（全幅・大） */}
                            <button
                              onClick={() => handleArrived(order, item)}
                              className="w-full py-2 rounded-lg text-sm font-bold transition-all"
                              style={item.inspection_status === 'arrived' ? INSP_BTNS[0].active : { ...idle, color: 'var(--success)', borderColor: 'rgba(129,236,255,0.25)' }}
                            >
                              受領
                            </button>
                            {/* 一部到着 / 終売 / 価格改定 */}
                            <div className="flex gap-1.5">
                              {([
                                { key: 'partial',       label: '一部到着', onClick: () => openPartial(order, item) },
                                { key: 'missing',       label: '終売',     onClick: () => handleMissing(order.id, item.id) },
                                { key: 'price_changed', label: '価格改定', onClick: () => openPriceChange(order, item) },
                              ] as const).map(btn => {
                                const isActive = item.inspection_status === btn.key
                                const activeStyle = INSP_BTNS.find(b => b.key === btn.key)!.active
                                return (
                                  <button
                                    key={btn.key}
                                    onClick={btn.onClick}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                    style={isActive ? activeStyle : idle}
                                  >
                                    {btn.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 備考 */}
              {order.notes && (
                <div
                  className="px-5 py-3 text-xs"
                  style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)', background: 'var(--bg-base)' }}
                >
                  {order.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── 発注先管理 ─── */}
      {tab === 'suppliers' && <SupplierManager suppliers={suppliers} />}

      {/* ══════════════════════════════════
          テキスト生成モーダル
      ══════════════════════════════════ */}
      {textModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>テキスト生成</p>
              <button
                onClick={() => { setTextModal(null); setCopiedId(null) }}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-base)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <RiCloseFill size={16} />
              </button>
            </div>

            <textarea
              value={textModal.text}
              onChange={e => setTextModal({ text: e.target.value })}
              rows={12}
              className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                lineHeight: '1.7',
              }}
            />

            <div className="flex gap-3">
              <button
                onClick={handleCopyFromModal}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
              >
                {copiedId === 'modal'
                  ? <><RiCheckLine size={14} />コピー済み</>
                  : <><RiFileCopyLine size={14} />コピーする</>
                }
              </button>
              <button
                onClick={() => { setTextModal(null); setCopiedId(null) }}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          一部到着モーダル
      ══════════════════════════════════ */}
      {partialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                一部到着{partialModal.isPriceChange ? '（価格改定）' : ''}
              </p>
              <button onClick={() => setPartialModal(null)} className="p-1.5 rounded-lg hover:bg-[var(--bg-base)]" style={{ color: 'var(--text-muted)' }}>
                <RiCloseFill size={16} />
              </button>
            </div>

            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {partialModal.productName}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              残 {partialModal.remaining} {partialModal.unit} 中、今回到着した数量を入力
            </p>

            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={partialModal.remaining}
              value={inputQty}
              onChange={e => setInputQty(e.target.value)}
              placeholder={`最大 ${partialModal.remaining}`}
              className="w-full px-3 py-3 rounded-xl text-base outline-none"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={confirmPartial}
                disabled={!inputQty || Number(inputQty) <= 0 || Number(inputQty) > partialModal.remaining}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
              >
                入庫する
              </button>
              <button
                onClick={() => setPartialModal(null)}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          価格改定モーダル
      ══════════════════════════════════ */}
      {priceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>価格改定</p>
              <button onClick={() => setPriceModal(null)} className="p-1.5 rounded-lg hover:bg-[var(--bg-base)]" style={{ color: 'var(--text-muted)' }}>
                <RiCloseFill size={16} />
              </button>
            </div>

            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {priceModal.productName}
            </p>

            {/* 現在の単価 */}
            {priceModal.originalPrice != null && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                現在の単価：¥{priceModal.originalPrice.toLocaleString()}
              </p>
            )}

            {/* 新しい単価入力 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                新しい単価（円）
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={inputPrice}
                onChange={e => setInputPrice(e.target.value)}
                placeholder="例: 2800"
                className="w-full px-3 py-3 rounded-xl text-base outline-none"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                autoFocus
              />
            </div>

            {/* 到着 / 一部到着 選択 */}
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              入庫方法を選択
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmPriceFull}
                disabled={!inputPrice || Number(inputPrice) <= 0}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'var(--success)', color: '#fff' }}
              >
                受領（{priceModal.remaining}{priceModal.unit}）
              </button>
              <button
                onClick={confirmPriceToPartial}
                disabled={!inputPrice || Number(inputPrice) <= 0}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'var(--warning)', color: '#fff' }}
              >
                一部到着
              </button>
            </div>

            <button
              onClick={() => setPriceModal(null)}
              className="w-full py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
