'use client'

import { useState } from 'react'
import { RiCheckFill } from 'react-icons/ri'
import { saveInventorySchedule, type InventorySchedule, type ScheduleType } from '@/app/admin/(protected)/settings/actions'

const TYPES: { key: ScheduleType; label: string }[] = [
  { key: 'monthly_end',   label: '月末' },
  { key: 'monthly_times', label: '月X回' },
  { key: 'interval',      label: 'X日ごと' },
]

export function InventoryScheduleForm({ schedule }: { schedule: InventorySchedule }) {
  const [type, setType] = useState<ScheduleType>(schedule.schedule_type)
  const [value, setValue] = useState(
    schedule.schedule_type === 'monthly_times' ? String(schedule.schedule_value ?? 1) :
    schedule.schedule_type === 'interval'      ? String(schedule.interval_days) :
    ''
  )
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const numVal = type === 'monthly_end' ? null : parseInt(value)
      if (type !== 'monthly_end' && (isNaN(numVal!) || numVal! < 1)) {
        setError('有効な数値を入力してください')
        return
      }
      const result = await saveInventorySchedule(type, numVal)
      if (result.error) setError(result.error)
      else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally { setSaving(false) }
  }

  const approxDays =
    type === 'monthly_times' && value && !isNaN(parseInt(value)) && parseInt(value) > 0
      ? Math.round(30 / parseInt(value))
      : null

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      {/* タイプ選択 */}
      <div className="space-y-2">
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>棚卸し周期の種類</p>
        <div className="flex gap-2 flex-wrap">
          {TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => { setType(t.key); setError(null) }}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: type === t.key ? 'var(--bg-dark)' : 'var(--bg-base)',
                color:      type === t.key ? 'var(--text-invert)' : 'var(--text-secondary)',
                border:     type === t.key ? 'none' : '1px solid var(--border)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 月末 */}
      {type === 'monthly_end' && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          毎月末に棚卸しを行います。前回の棚卸しから31日を超えると期限超過として表示されます。
        </p>
      )}

      {/* 月X回 */}
      {type === 'monthly_times' && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>月の回数</p>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 h-12 rounded-xl w-28"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
            >
              <input
                type="number" min="1" max="31" step="1"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full text-base tabular-nums outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>回 / 月</span>
          </div>
          {approxDays && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              約 {approxDays} 日ごとに棚卸しを行います
            </p>
          )}
        </div>
      )}

      {/* X日ごと */}
      {type === 'interval' && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>周期（日）</p>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 h-12 rounded-xl w-28"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
            >
              <input
                type="number" min="1" max="365" step="1"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full text-base tabular-nums outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>日ごと</span>
          </div>
        </div>
      )}

      {error && <p className="text-xs" style={{ color: '#d84f2a' }}>{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-60"
        style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
      >
        <RiCheckFill size={14} />
        {saved ? '保存しました' : saving ? '保存中...' : '保存する'}
      </button>
    </div>
  )
}
