'use client'

import { useState, useTransition } from 'react'
import {
  RiPrinterFill,
  RiSendPlaneFill,
  RiCheckboxCircleFill,
  RiDeleteBinFill,
  RiFileListLine,
} from 'react-icons/ri'
import { OrderCart } from './OrderCart'
import { SupplierManager } from '@/components/admin/suppliers/SupplierManager'
import { updateOrderStatus, receiveOrder, deleteOrder } from '@/app/admin/(protected)/orders/actions'
import type { CartItem } from './OrderCart'
import type { IssuerProfile } from '@/app/admin/(protected)/orders/issuer-actions'

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
    id:       string
    quantity: number
    product_name: string
    product_unit: string
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

  const TABS: { key: Tab; label: string }[] = [
    { key: 'order',     label: '発注管理' },
    { key: 'history',   label: '発注履歴' },
    { key: 'suppliers', label: '発注先管理' },
  ]

  return (
    <div className="max-w-5xl space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>発注管理</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {tab === 'order'     && '発注する商品を選んで発注書を作成'}
          {tab === 'history'   && `過去の発注書 ${orders.length} 件`}
          {tab === 'suppliers' && `発注先 ${suppliers.length} 件`}
        </p>
      </div>

      {/* タブ（スマホ全幅 / デスクトップ左寄せ） */}
      <div>
        <div
          className="flex w-full sm:w-auto rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium transition-all"
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
                    <span
                      className="flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-medium"
                      style={STATUS_STYLE[order.status]}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
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

                    <div className="flex items-center gap-1 ml-2">
                      <a
                        href={`/admin/orders/${order.id}/print`}
                        target="_blank"
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)]"
                        style={{ color: 'var(--text-secondary)' }}
                        title="発注書を印刷"
                      >
                        <RiPrinterFill size={14} />
                      </a>
                      {order.status === 'draft' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'sent')}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)]"
                          style={{ color: 'var(--text-secondary)' }}
                          title="送付済みにする"
                        >
                          <RiSendPlaneFill size={14} />
                        </button>
                      )}
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
                    <div key={item.id} className="flex items-center justify-between px-5 py-2.5 gap-4">
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {item.product_name}
                      </p>
                      <p className="text-sm tabular-nums flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                        {item.quantity} {item.product_unit}
                      </p>
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
