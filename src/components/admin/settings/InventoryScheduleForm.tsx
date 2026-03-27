'use client'

import { useState } from 'react'
import { RiCheckFill, RiDeleteBinLine } from 'react-icons/ri'
import { saveNextInventoryDate } from '@/app/admin/(protected)/settings/actions'

export function InventoryScheduleForm({ nextDate }: { nextDate: string | null }) {
  const [date,   setDate]   = useState(nextDate ?? '')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSave() {
    if (!date) { setError('日付を選択してください'); return }
    setSaving(true); setError(null); setSaved(false)
    try {
      const result = await saveNextInventoryDate(date)
      if (result.error) setError(result.error)
      else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally { setSaving(false) }
  }

  async function handleClear() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const result = await saveNextInventoryDate(null)
      if (result.error) setError(result.error)
      else { setDate(''); setSaved(true); setTimeout(() => setSaved(false), 2000) }
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました')
    } finally { setSaving(false) }
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="space-y-1.5">
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>次回棚卸し予定日</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          設定した日付を過ぎると棚卸しページにリマインドが表示されます
        </p>
        <div
          className="flex items-center px-3 h-12 rounded-xl w-52"
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
        >
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="flex-1 text-base outline-none bg-transparent"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {error && <p className="text-xs" style={{ color: '#d84f2a' }}>{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
        >
          <RiCheckFill size={14} />
          {saved ? '保存しました' : saving ? '保存中...' : '保存する'}
        </button>

        {date && (
          <button
            onClick={handleClear}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            <RiDeleteBinLine size={13} />
            クリア
          </button>
        )}
      </div>
    </div>
  )
}
