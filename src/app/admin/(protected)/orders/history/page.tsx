import { createServiceClient } from '@/lib/supabase/server'
import { updateOrderStatus, deleteOrder, receiveOrder } from '../actions'
import {
  RiPrinterFill,
  RiSendPlaneFill,
  RiCheckboxCircleFill,
  RiDeleteBinFill,
  RiFileListLine,
} from 'react-icons/ri'

const STATUS_LABEL = {
  draft:     '下書き',
  sent:      '送付済み',
  received:  '受領済み',
  cancelled: 'キャンセル',
} as const
type OrderStatus = keyof typeof STATUS_LABEL

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string; border?: string }> = {
  draft:     { bg: 'var(--bg-base)',    color: 'var(--text-secondary)', border: '1px solid var(--border)' },
  sent:      { bg: 'var(--bg-base)',    color: 'var(--text-primary)',   border: '1px solid var(--border)' },
  received:  { bg: 'var(--bg-dark)',    color: 'var(--text-invert)' },
  cancelled: { bg: 'var(--bg-base)',    color: 'var(--text-muted)',     border: '1px solid var(--border)' },
}

export default async function OrderHistoryPage() {
  const supabase = await createServiceClient()

  const { data: orders } = await supabase
    .from('purchase_orders')
    .select(`
      id, status, order_date, expected_date, created_at, notes,
      suppliers!supplier_id(name),
      purchase_order_items(id, quantity, unit_price, products(name, unit))
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>発注履歴</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          過去の発注書一覧
        </p>
      </div>

      {(orders?.length ?? 0) === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-2xl gap-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <RiFileListLine size={28} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>発注履歴がありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders!.map(order => {
            const status   = order.status as OrderStatus
            const supplier = order.suppliers as unknown as { name: string } | null
            const items    = order.purchase_order_items as unknown as {
              id: string
              quantity: number
              unit_price: number | null
              products: { name: string; unit: string }
            }[]

            return (
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
                        {supplier?.name ?? '発注先不明'}
                      </p>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-medium"
                      style={STATUS_STYLE[status]}
                    >
                      {STATUS_LABEL[status]}
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

                    {/* アクション */}
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
                      {status === 'draft' && (
                        <form action={async () => { 'use server'; await updateOrderStatus(order.id, 'sent') }}>
                          <button
                            type="submit"
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)]"
                            style={{ color: 'var(--text-secondary)' }}
                            title="送付済みにする"
                          >
                            <RiSendPlaneFill size={14} />
                          </button>
                        </form>
                      )}
                      {status === 'sent' && (
                        <form action={async () => { 'use server'; await receiveOrder(order.id) }}>
                          <button
                            type="submit"
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)]"
                            style={{ color: 'var(--text-secondary)' }}
                            title="受領済みにする"
                          >
                            <RiCheckboxCircleFill size={14} />
                          </button>
                        </form>
                      )}
                      {status === 'draft' && (
                        <form action={async () => { 'use server'; await deleteOrder(order.id) }}>
                          <button
                            type="submit"
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)]"
                            style={{ color: 'var(--text-muted)' }}
                            title="削除"
                          >
                            <RiDeleteBinFill size={14} />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>

                {/* 品目リスト */}
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-5 py-2.5 gap-4">
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {item.products.name}
                      </p>
                      <p className="text-sm tabular-nums flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                        {item.quantity} {item.products.unit}
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
            )
          })}
        </div>
      )}
    </div>
  )
}
