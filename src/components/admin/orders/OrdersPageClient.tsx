'use client'

import { useState, useTransition } from 'react'
import {
  RiPrinterFill,
  RiCheckboxCircleFill,
  RiDeleteBinFill,
  RiFileListLine,
} from 'react-icons/ri'
import { OrderCart } from './OrderCart'
import { SupplierManager } from '@/components/admin/suppliers/SupplierManager'
import { updateOrderStatus, receiveOrder, deleteOrder, updateItemInspectionStatus } from '@/app/admin/(protected)/orders/actions'
import type { CartItem } from './OrderCart'
import type { IssuerProfile } from '@/app/admin/(protected)/orders/issuer-actions'

type InspectionStatus = 'arrived' | 'partial' | 'missing' | 'price_changed' | null

const INSPECTION_BUTTONS: { status: InspectionStatus & string; label: string; activeStyle: React.CSSProperties }[] = [
  {
    status: 'arrived',
    label: '到着',
    activeStyle: { background: '#22c55e', color: '#fff', border: '1px solid #16a34a' },
  },
  {
    status: 'partial',
    label: '一部到着',
    activeStyle: { background: '#f59e0b', color: '#fff', border: '1px solid #d97706' },
  },
  {
    status: 'missing',
    label: '欠品',
    activeStyle: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
  },
  {
    status: 'price_changed',
    label: '価格変更',
    activeStyle: { background: '#8b5cf6', color: '#fff', border: '1px solid #7c3aed' },
  },
]

type Tab = 'order' | 'history' | 'suppliers'

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

type Order = {
  id:            string
  status:        OrderStatus
  order_date:    string
  expected_date: string | null
  created_at:    string
  notes:         string | null
  supplier_name: string | null
  items: {
    id:                string
    quantity:          number
    product_name:      string
    product_unit:      string
    inspection_status: InspectionStatus
  }[]
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  draft:     '下書き',
  sent:      '送付済み',
  received:  '受領済み',
  cancelled: 'キャンセル',
}
const STATUS_STYLE: Record<OrderStatus, React.CSSProperties> = {
  draft:     { background: 'var(--bg-base)',  color: 'var(--text-secondary)', border: '1px solid var(--border)' },
  sent:      { background: 'var(--bg-base)',  color: 'var(--text-primary)',   border: '1px solid var(--border)' },
  received:  { background: 'var(--bg-dark)',  color: 'var(--text-invert)' },
  cancelled: { background: 'var(--bg-base)',  color: 'var(--text-muted)',     border: '1px solid var(--border)' },
}

export function OrdersPageClient({
  cartItems,
  orders: initialOrders,
  suppliers,
  issuerProfile,
}: {
  cartItems:     CartItem[]
  orders:        Order[]
  suppliers:     Supplier[]
  issuerProfile: IssuerProfile
}) {
  const [tab, setTab] = useState<Tab>('order')
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [, startTransition] = useTransition()

  function handleStatusUpdate(orderId: string, status: OrderStatus) {
    startTransition(async () => {
      await updateOrderStatus(orderId, status)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    })
  }

  function handleReceive(orderId: string) {
    startTransition(async () => {
      await receiveOrder(orderId)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'received' } : o))
    })
  }

  function handleDelete(orderId: string) {
    startTransition(async () => {
      await deleteOrder(orderId)
      setOrders(prev => prev.filter(o => o.id !== orderId))
    })
  }

  function handleInspection(orderId: string, itemId: string, status: InspectionStatus & string) {
    startTransition(async () => {
      // 同じボタンを押したらリセット
      const currentOrder = orders.find(o => o.id === orderId)
      const currentItem  = currentOrder?.items.find(i => i.id === itemId)
      const next = currentItem?.inspection_status === status ? null : status
      setOrders(prev => prev.map(o =>
        o.id !== orderId ? o : {
          ...o,
          items: o.items.map(i => i.id !== itemId ? i : { ...i, inspection_status: next }),
        }
      ))
      await updateItemInspectionStatus(itemId, next)
    })
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'order',     label: '発注書作成' },
    { key: 'history',   label: '検品' },
    { key: 'suppliers', label: '発注先一覧' },
  ]

  return (
    <div className="max-w-5xl space-y-6">
      {/* ヘッダー + タブ */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>発注/検品</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {tab === 'order'     && '発注する商品を選んで発注書を作成'}
            {tab === 'history'   && `発注書 ${orders.length} 件`}
            {tab === 'suppliers' && `発注先 ${suppliers.length} 件`}
          </p>
        </div>

        {/* デスクトップのみヘッダー横に表示 */}
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
                background: tab === t.key ? 'var(--bg-dark)' : 'transparent',
                color:      tab === t.key ? 'var(--text-invert)' : 'var(--text-secondary)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* スマホのみ全幅タブ */}
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
              background: tab === t.key ? 'var(--bg-dark)' : 'transparent',
              color:      tab === t.key ? 'var(--text-invert)' : 'var(--text-secondary)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 発注管理 */}
      {tab === 'order' && <OrderCart items={cartItems} />}

      {/* 発注履歴 */}
      {tab === 'history' && (
        orders.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 rounded-2xl gap-3"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <RiFileListLine size={28} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>発注履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div
                key={order.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                {/* ヘッダー行 */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
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
                    {order.expected_date && (
                      <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        → {order.expected_date}
                      </span>
                    )}

                    <div className="flex items-center gap-2 ml-2">
                      <a
                        href={`/admin/orders/${order.id}/print`}
                        target="_blank"
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
                        style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)', textDecoration: 'none' }}
                      >
                        <RiPrinterFill size={13} />
                        発注書をみる
                      </a>
                      {order.status === 'sent' && (
                        <button
                          onClick={() => handleReceive(order.id)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)]"
                          style={{ color: 'var(--text-secondary)' }}
                          title="受領済みにする"
                        >
                          <RiCheckboxCircleFill size={14} />
                        </button>
                      )}
                      {order.status === 'draft' && (
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)]"
                          style={{ color: 'var(--text-muted)' }}
                          title="削除"
                        >
                          <RiDeleteBinFill size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 品目リスト */}
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {order.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 px-5 py-4"
                    >
                      {/* 商品名 + 数量 */}
                      <div className="flex items-baseline gap-3 min-w-0">
                        <p className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {item.product_name}
                        </p>
                        <p
                          className="text-2xl font-bold tabular-nums flex-shrink-0"
                          style={{ color: 'var(--text-primary)', lineHeight: 1 }}
                        >
                          {item.quantity}
                          <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-muted)' }}>
                            {item.product_unit}
                          </span>
                        </p>
                      </div>

                      {/* 検品ボタン */}
                      <div className="flex flex-wrap gap-1.5 flex-shrink-0 justify-end">
                        {INSPECTION_BUTTONS.map(btn => {
                          const isActive = item.inspection_status === btn.status
                          return (
                            <button
                              key={btn.status}
                              onClick={() => handleInspection(order.id, item.id, btn.status)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                              style={
                                isActive
                                  ? btn.activeStyle
                                  : { background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                              }
                            >
                              {btn.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
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
        )
      )}

      {/* 発注先管理 */}
      {tab === 'suppliers' && <SupplierManager suppliers={suppliers} />}
    </div>
  )
}
