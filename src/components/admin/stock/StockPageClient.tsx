'use client'

import { useState } from 'react'
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
}: {
  items:        StockItem[]
  transactions: TxRow[]
  lowCount:     number
}) {
  const [tab, setTab] = useState<Tab>('stock')

  return (
    <div className="max-w-6xl space-y-6">
      {/* ヘッダー + タブ */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>入出庫管理</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {items.length} 件
            {lowCount > 0 && (
              <span className="ml-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                — 在庫不足 {lowCount} 件
              </span>
            )}
          </p>
        </div>

        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          {([
            { key: 'stock',   label: '在庫管理' },
            { key: 'history', label: '入出庫履歴' },
          ] as { key: Tab; label: string }[]).map(t => (
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

      {tab === 'stock'
        ? <StockGrid items={items} />
        : <HistoryClient transactions={transactions} />
      }
    </div>
  )
}
