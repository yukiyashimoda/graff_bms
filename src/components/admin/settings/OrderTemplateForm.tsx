'use client'

import { useState } from 'react'
import { RiCheckFill } from 'react-icons/ri'
import { saveOrderTextTemplate, type AppSettings } from '@/app/admin/(protected)/settings/actions'

const DEFAULT_TEMPLATE = `お世話になっております。
下記の通り発注をお願いいたします。

【注文内容】
{{items}}

{{delivery}}`

export function OrderTemplateForm({ settings }: { settings: AppSettings }) {
  const [template, setTemplate] = useState(settings.order_text_template)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const result = await saveOrderTextTemplate(template)
      if (result.error) setError(result.error)
      else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally { setSaving(false) }
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>テキスト雛形</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="font-mono">{'{{items}}'}</span> → 注文品目一覧、
          <span className="font-mono ml-1">{'{{delivery}}'}</span> → 納品希望日 に置き換えられます
        </p>
      </div>

      <textarea
        value={template}
        onChange={e => setTemplate(e.target.value)}
        rows={12}
        className="w-full px-3 py-3 text-sm outline-none resize-y rounded-xl font-mono"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />

      {error && <p className="text-xs" style={{ color: '#d84f2a' }}>{error}</p>}

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={handleSave} disabled={saving || saved}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}>
          <RiCheckFill size={14} />
          {saved ? '保存しました' : saving ? '保存中...' : '保存する'}
        </button>
        <button
          onClick={() => setTemplate(DEFAULT_TEMPLATE)}
          className="px-4 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
          style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          デフォルトに戻す
        </button>
      </div>
    </div>
  )
}
