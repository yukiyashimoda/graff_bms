'use client'

import { useState } from 'react'
import { RiCheckFill } from 'react-icons/ri'
import { saveAlertThreshold, type AppSettings } from '@/app/admin/(protected)/settings/actions'

export function AlertThresholdForm({ settings }: { settings: AppSettings }) {
  const [threshold, setThreshold] = useState(String(settings.alert_threshold))
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSave() {
    const val = parseFloat(threshold)
    if (isNaN(val) || val <= 0 || val > 100) { setError('1〜100の数値を入力してください'); return }
    setSaving(true); setError(null); setSaved(false)
    try {
      const result = await saveAlertThreshold(val)
      if (result.error) setError(result.error)
      else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally { setSaving(false) }
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="space-y-1.5">
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>アラートしきい値</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          この割合以上価格が上昇した場合に価格アラートを記録します
        </p>
        <div className="flex items-center gap-3 pt-1">
          <div
            className="flex items-center gap-2 px-3 h-12 rounded-xl w-32"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
          >
            <input
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              className="w-full text-base tabular-nums outline-none bg-transparent"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>% 以上</span>
        </div>
        <p className="text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
          現在の設定: <span className="font-semibold">{settings.alert_threshold}%</span>
        </p>
      </div>

      {error && <p className="text-xs" style={{ color: '#d84f2a' }}>{error}</p>}

      <button onClick={handleSave} disabled={saving || saved}
        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-60"
        style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}>
        <RiCheckFill size={14} />
        {saved ? '保存しました' : saving ? '保存中...' : '保存する'}
      </button>
    </div>
  )
}
