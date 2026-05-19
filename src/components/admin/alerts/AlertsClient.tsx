'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RiArrowUpFill, RiCheckFill, RiInboxLine } from 'react-icons/ri'
import { markAlertRead, markAllAlertsRead } from '@/app/admin/(protected)/alerts/actions'

export type AlertRow = {
  id:              string
  previous_price:  number
  new_price:       number
  change_rate:     number
  is_read:         boolean
  created_at:      string
  product_name:    string
  product_name_en: string
  unit:            string
}

export function AlertsClient({ alerts }: { alerts: AlertRow[] }) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  const unread = alerts.filter(a => !a.is_read)

  async function handleMarkAll() {
    setLoading(true)
    await markAllAlertsRead()
    router.refresh()
    setLoading(false)
  }

  async function handleMark(id: string) {
    await markAlertRead(id)
    router.refresh()
  }

  if (alerts.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <RiInboxLine size={32} style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>アラートはありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {unread.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleMarkAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
          >
            <RiCheckFill size={12} />
            すべて既読にする
          </button>
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {alerts.map((a, i) => (
          <div
            key={a.id}
            className="flex items-center gap-4 px-5 py-4"
            style={{
              borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : undefined,
              opacity: a.is_read ? 0.5 : 1,
            }}
          >
            {/* アイコン */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#d84f2a22' }}
            >
              <RiArrowUpFill size={16} style={{ color: '#d84f2a' }} />
            </div>

            {/* 商品名 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {a.product_name}
              </p>
              {a.product_name_en && (
                <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{a.product_name_en}</p>
              )}
            </div>

            {/* 価格変動 */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold tabular-nums" style={{ color: '#d84f2a' }}>
                +{Math.round(a.change_rate * 100)}%
              </p>
              <p className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                ¥{a.previous_price.toLocaleString()} → ¥{a.new_price.toLocaleString()}
              </p>
            </div>

            {/* 日時 */}
            <div className="text-right flex-shrink-0 hidden sm:block">
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {new Date(a.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
              </p>
            </div>

            {/* 既読ボタン */}
            {!a.is_read && (
              <button
                onClick={() => handleMark(a.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:bg-[var(--bg-base)]"
                title="既読にする"
                style={{ color: 'var(--text-muted)' }}
              >
                <RiCheckFill size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
