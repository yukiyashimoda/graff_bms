'use client'

import { useState, useMemo, useTransition } from 'react'
import { RiSearchLine, RiAddLine, RiGlassesFill, RiEditLine, RiDeleteBinLine } from 'react-icons/ri'
import { createGlass, updateGlass, deleteGlass, toggleGlassAvailability } from '@/app/admin/(protected)/products/glass-actions'

export type GlassRow = {
  id:           string
  name:         string
  name_en:      string
  type:         string
  size_ml:      number | null
  image_url:    string | null
  notes:        string | null
  is_available: boolean
  sort_order:   number
}

const TYPE_LABELS: Record<string, string> = {
  highball:  'ハイボール',
  rocks:     'ロック',
  wine:      'ワイン',
  champagne: 'シャンパン',
  shot:      'ショット',
  cocktail:  'カクテル',
  beer:      'ビール',
  other:     'その他',
}

const TYPE_OPTIONS = Object.entries(TYPE_LABELS)

function GlassForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<GlassRow>
  onSubmit: (data: Omit<GlassRow, 'id' | 'sort_order'>) => void
  onCancel: () => void
  submitting: boolean
}) {
  const [name,         setName]         = useState(initial?.name         ?? '')
  const [nameEn,       setNameEn]       = useState(initial?.name_en      ?? '')
  const [type,         setType]         = useState(initial?.type         ?? 'other')
  const [sizeMl,       setSizeMl]       = useState(initial?.size_ml?.toString() ?? '')
  const [notes,        setNotes]        = useState(initial?.notes        ?? '')
  const [isAvailable,  setIsAvailable]  = useState(initial?.is_available ?? true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      name_en:      nameEn,
      type,
      size_ml:      sizeMl ? parseFloat(sizeMl) : null,
      image_url:    initial?.image_url ?? null,
      notes:        notes || null,
      is_available: isAvailable,
    })
  }

  const fieldStyle = {
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>グラス名 *</label>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 h-10 text-sm rounded-xl outline-none"
            style={fieldStyle}
          />
        </div>
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>英語名</label>
          <input
            value={nameEn}
            onChange={e => setNameEn(e.target.value)}
            className="w-full px-3 h-10 text-sm rounded-xl outline-none"
            style={fieldStyle}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>種類</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full px-3 h-10 text-sm rounded-xl outline-none"
            style={fieldStyle}
          >
            {TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>容量 (ml)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={sizeMl}
            onChange={e => setSizeMl(e.target.value)}
            placeholder="例: 300"
            className="w-full px-3 h-10 text-sm rounded-xl outline-none"
            style={fieldStyle}
          />
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>メモ</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-xl outline-none resize-none"
            style={fieldStyle}
          />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="glass-available"
            checked={isAvailable}
            onChange={e => setIsAvailable(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="glass-available" className="text-sm" style={{ color: 'var(--text-primary)' }}>
            公開する
          </label>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 h-9 text-sm rounded-xl transition-opacity hover:opacity-70"
          style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 h-9 text-sm font-semibold rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
        >
          {submitting ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}

export function GlassesClient({ glasses: initial }: { glasses: GlassRow[] }) {
  const [glasses,   setGlasses]  = useState(initial)
  const [query,     setQuery]    = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [showForm,  setShowForm] = useState(false)
  const [editing,   setEditing]  = useState<GlassRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const types = useMemo(() => {
    const seen = new Set<string>()
    glasses.forEach(g => seen.add(g.type))
    return Array.from(seen).sort()
  }, [glasses])

  const filtered = useMemo(() => {
    return glasses.filter(g => {
      if (typeFilter && g.type !== typeFilter) return false
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return g.name.toLowerCase().includes(q) || (g.name_en ?? '').toLowerCase().includes(q)
    })
  }, [glasses, query, typeFilter])

  function handleCreate(data: Omit<GlassRow, 'id' | 'sort_order'>) {
    startTransition(async () => {
      const result = await createGlass(data)
      if (result.data) {
        setGlasses(prev => [...prev, result.data!])
        setShowForm(false)
      }
    })
  }

  function handleUpdate(data: Omit<GlassRow, 'id' | 'sort_order'>) {
    if (!editing) return
    startTransition(async () => {
      const result = await updateGlass(editing.id, data)
      if (result.data) {
        setGlasses(prev => prev.map(g => g.id === editing.id ? result.data! : g))
        setEditing(null)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('このグラスを削除しますか？')) return
    startTransition(async () => {
      await deleteGlass(id)
      setGlasses(prev => prev.filter(g => g.id !== id))
    })
  }

  function handleToggle(id: string, val: boolean) {
    startTransition(async () => {
      await toggleGlassAvailability(id, val)
      setGlasses(prev => prev.map(g => g.id === id ? { ...g, is_available: val } : g))
    })
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>グラス管理</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {(query || typeFilter) ? `${filtered.length} / ${glasses.length} 件` : `${glasses.length} 件`}
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 flex-shrink-0"
            style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
          >
            <RiAddLine size={16} />
            <span className="hidden sm:inline">グラスを追加</span>
            <span className="sm:hidden">追加</span>
          </button>
        </div>

        {/* タイプフィルター */}
        {types.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <TypeBtn label="すべて" active={typeFilter === null} onClick={() => setTypeFilter(null)} />
            {types.map(t => (
              <TypeBtn key={t} label={TYPE_LABELS[t] ?? t} active={typeFilter === t} onClick={() => setTypeFilter(t)} />
            ))}
          </div>
        )}

        {/* 検索 */}
        <div
          className="flex items-center gap-2 px-3 h-11 rounded-xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <RiSearchLine size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="グラス名で検索..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* 追加フォーム */}
      {showForm && !editing && (
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>新規グラス</p>
          <GlassForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            submitting={isPending}
          />
        </div>
      )}

      {/* 一覧 */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {glasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RiGlassesFill size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>グラスがまだありません</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <RiSearchLine size={28} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>「{query}」に一致するグラスがありません</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map(g => (
              <div key={g.id}>
                {editing?.id === g.id ? (
                  <div className="p-5">
                    <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>編集: {g.name}</p>
                    <GlassForm
                      initial={editing}
                      onSubmit={handleUpdate}
                      onCancel={() => setEditing(null)}
                      submitting={isPending}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* アイコン */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg-base)' }}
                    >
                      <RiGlassesFill size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>

                    {/* 名前 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: g.is_available ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {g.name}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {TYPE_LABELS[g.type] ?? g.type}
                        {g.size_ml ? ` · ${g.size_ml}ml` : ''}
                      </p>
                    </div>

                    {/* 公開トグル */}
                    <button
                      onClick={() => handleToggle(g.id, !g.is_available)}
                      className="px-2.5 h-6 text-[10px] font-semibold rounded-full transition-opacity hover:opacity-80"
                      style={g.is_available
                        ? { background: '#22c55e22', color: '#16a34a' }
                        : { background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                      }
                    >
                      {g.is_available ? '公開中' : '非公開'}
                    </button>

                    {/* 操作 */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setShowForm(false); setEditing(g) }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-base)]"
                        style={{ color: 'var(--text-muted)' }}
                        title="編集"
                      >
                        <RiEditLine size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-base)]"
                        style={{ color: '#ef4444' }}
                        title="削除"
                      >
                        <RiDeleteBinLine size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TypeBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
      style={active
        ? { background: '#102937', color: '#ededed' }
        : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
      }
    >
      {label}
    </button>
  )
}
