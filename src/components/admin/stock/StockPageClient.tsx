'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RiClipboardLine } from 'react-icons/ri'
import { StockGrid } from './StockGrid'
import { HistoryClient } from './HistoryClient'
import type { StockItem } from './StockGrid'

type TxRow = {
  id:               string
  type:             'in' | 'out' | 'adjustment'
  quantity:         number
  cost_price:       number | null
  notes:            string | null
  created_at:       string
  product_name:     string
  product_name_en:  string
  unit:             string
  product_category: string | null
}

type Tab = 'stock' | 'history'

export function StockPageClient({
  items,
  transactions,
  lowCount,
  initialZeroFilter = false,
}: {
  items:              StockItem[]
  transactions:       TxRow[]
  lowCount:           number
  initialZeroFilter?: boolean
}) {
  const [tab, setTab] = useState<Tab>('stock')

  return (
    <div className="max-w-6xl space-y-6">
      {/* ヘッダー + タブ */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-bitcount, system-ui)' }}>STOCK</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {items.length} 件
            {lowCount > 0 && (
              <span className="ml-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                — 在庫不足 {lowCount} 件
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full">
          {/* 棚卸ボタン */}
          <Link
            href="/admin/inventory"
            className="flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 whitespace-nowrap flex-shrink-0"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <RiClipboardLine size={14} />
            棚卸
          </Link>

          {/* タブ切り替え */}
          <div
            className="flex flex-1 rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
          >
            {([
              { key: 'stock',   label: '在庫管理' },
              { key: 'history', label: '入出庫履歴' },
            ] as { key: Tab; label: string }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-1 h-9 text-sm font-medium transition-all"
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
      </div>

      {tab === 'stock'
        ? <StockGrid items={items} initialZeroFilter={initialZeroFilter} />
        : <HistoryClient transactions={transactions} />
      }
    </div>
  )
}
