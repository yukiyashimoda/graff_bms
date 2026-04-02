'use client'

import { useState, useCallback } from 'react'
import { updateMinQuantity } from '@/app/admin/(protected)/stock/actions'

type Row = {
  id:           string
  name:         string
  unit:         string
  min_quantity: number
}

export function StockAlertsClient({ rows }: { rows: Row[] }) {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>必須在庫設定</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          在庫がこの本数を下回ると「在庫不足」として表示されます
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            商品が登録されていません
          </p>
        ) : (
          rows.map((row, i) => (
            <MinRow
              key={row.id}
              id={row.id}
              name={row.name}
              unit={row.unit}
              defaultMin={row.min_quantity}
              divider={i > 0}
            />
          ))
        )}
      </div>
    </div>
  )
}

function MinRow({
  id, name, unit, defaultMin, divider,
}: {
  id: string; name: string; unit: string; defaultMin: number; divider: boolean
}) {
  const [value,  setValue]  = useState(String(defaultMin))
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const handleBlur = useCallback(async () => {
    const num  = parseInt(value, 10)
    const next = isNaN(num) || num < 0 ? 0 : num
    setValue(String(next))
    if (next === defaultMin) return
    setSaving(true)
    try {
      await updateMinQuantity(id, next)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } finally {
      setSaving(false)
    }
  }, [id, value, defaultMin])

  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5"
      style={{ borderTop: divider ? '1px solid var(--border)' : undefined }}
    >
      <p className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
        {name}
      </p>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl"
          style={{ background: 'var(--bg-base)', border: `1px solid ${saving ? 'rgba(129,236,255,0.3)' : 'var(--border)'}`, width: 80 }}
        >
          <input
            type="number"
            min="0"
            step="1"
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
            className="w-full text-sm tabular-nums outline-none bg-transparent text-right"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <span className="text-xs w-6" style={{ color: 'var(--text-muted)' }}>{unit || '本'}</span>
        <span
          className="text-[10px] font-semibold w-8 text-right transition-opacity"
          style={{ color: 'var(--success)', opacity: saved ? 1 : 0 }}
        >
          保存
        </span>
      </div>
    </div>
  )
}
