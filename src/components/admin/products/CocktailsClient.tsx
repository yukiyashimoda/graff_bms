'use client'

import { useState, useMemo, useTransition } from 'react'
import { RiSearchLine, RiAddLine, RiCupFill, RiEditLine, RiDeleteBinLine, RiPriceTag3Fill } from 'react-icons/ri'
import {
  createCocktail,
  updateCocktail,
  deleteCocktail,
  toggleCocktailAvailability,
} from '@/app/admin/(protected)/products/cocktail-actions'

export type CocktailRow = {
  id:           string
  name:         string
  name_en:      string
  description:  string
  selling_price: number | null
  image_url:    string | null
  tags:         string[]
  is_available: boolean
  sort_order:   number
  total_cost:   number | null
  cost_rate_pct: number | null
}

function CocktailForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<CocktailRow>
  onSubmit: (data: Omit<CocktailRow, 'id' | 'sort_order' | 'total_cost' | 'cost_rate_pct'>) => void
  onCancel: () => void
  submitting: boolean
}) {
  const [name,          setName]          = useState(initial?.name          ?? '')
  const [nameEn,        setNameEn]        = useState(initial?.name_en       ?? '')
  const [description,   setDescription]   = useState(initial?.description   ?? '')
  const [sellingPrice,  setSellingPrice]  = useState(initial?.selling_price?.toString() ?? '')
  const [tags,          setTags]          = useState((initial?.tags ?? []).join(', '))
  const [isAvailable,   setIsAvailable]   = useState(initial?.is_available  ?? true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      name_en:       nameEn,
      description,
      selling_price: sellingPrice ? parseFloat(sellingPrice) : null,
      image_url:     initial?.image_url ?? null,
      tags:          tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      is_available:  isAvailable,
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
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>カクテル名 *</label>
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
        <div className="space-y-1 col-span-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>説明</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-xl outline-none resize-none"
            style={fieldStyle}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>販売価格 (¥)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={sellingPrice}
            onChange={e => setSellingPrice(e.target.value)}
            placeholder="例: 1200"
            className="w-full px-3 h-10 text-sm rounded-xl outline-none"
            style={fieldStyle}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>タグ (カンマ区切り)</label>
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="例: ジン, スパークリング"
            className="w-full px-3 h-10 text-sm rounded-xl outline-none"
            style={fieldStyle}
          />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="cocktail-available"
            checked={isAvailable}
            onChange={e => setIsAvailable(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="cocktail-available" className="text-sm" style={{ color: 'var(--text-primary)' }}>
            メニューに公開する
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

export function CocktailsClient({ cocktails: initial }: { cocktails: CocktailRow[] }) {
  const [cocktails,  setCocktails]  = useState(initial)
  const [query,      setQuery]      = useState('')
  const [showForm,   setShowForm]   = useState(false)
  const [editing,    setEditing]    = useState<CocktailRow | null>(null)
  const [isPending,  startTransition] = useTransition()

  const filtered = useMemo(() => {
    if (!query.trim()) return cocktails
    const q = query.toLowerCase()
    return cocktails.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.name_en ?? '').toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [cocktails, query])

  function handleCreate(data: Omit<CocktailRow, 'id' | 'sort_order' | 'total_cost' | 'cost_rate_pct'>) {
    startTransition(async () => {
      const result = await createCocktail(data)
      if (result.data) {
        setCocktails(prev => [...prev, result.data!])
        setShowForm(false)
      }
    })
  }

  function handleUpdate(data: Omit<CocktailRow, 'id' | 'sort_order' | 'total_cost' | 'cost_rate_pct'>) {
    if (!editing) return
    startTransition(async () => {
      const result = await updateCocktail(editing.id, data)
      if (result.data) {
        setCocktails(prev => prev.map(c => c.id === editing.id ? { ...c, ...result.data! } : c))
        setEditing(null)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('このカクテルを削除しますか？')) return
    startTransition(async () => {
      await deleteCocktail(id)
      setCocktails(prev => prev.filter(c => c.id !== id))
    })
  }

  function handleToggle(id: string, val: boolean) {
    startTransition(async () => {
      await toggleCocktailAvailability(id, val)
      setCocktails(prev => prev.map(c => c.id === id ? { ...c, is_available: val } : c))
    })
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>カクテル管理</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {query ? `${filtered.length} / ${cocktails.length} 件` : `${cocktails.length} 件`}
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 flex-shrink-0"
            style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
          >
            <RiAddLine size={16} />
            <span className="hidden sm:inline">カクテルを追加</span>
            <span className="sm:hidden">追加</span>
          </button>
        </div>

        <div
          className="flex items-center gap-2 px-3 h-11 rounded-xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <RiSearchLine size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="カクテル名・タグで検索..."
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
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>新規カクテル</p>
          <CocktailForm
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
        {cocktails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RiCupFill size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>カクテルがまだありません</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <RiSearchLine size={28} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>「{query}」に一致するカクテルがありません</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map(c => (
              <div key={c.id}>
                {editing?.id === c.id ? (
                  <div className="p-5">
                    <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>編集: {c.name}</p>
                    <CocktailForm
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
                      <RiCupFill size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>

                    {/* 名前 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: c.is_available ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {c.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {c.name_en && (
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{c.name_en}</span>
                        )}
                        {c.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {c.tags.slice(0, 3).map(t => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 text-[9px] font-medium rounded-full"
                                style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 価格・原価率 */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      {c.selling_price != null && (
                        <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          ¥{c.selling_price.toLocaleString()}
                        </p>
                      )}
                      {c.cost_rate_pct != null && (
                        <p className="text-[11px] tabular-nums flex items-center gap-1 justify-end" style={{ color: 'var(--text-muted)' }}>
                          <RiPriceTag3Fill size={10} />
                          原価率 {c.cost_rate_pct}%
                        </p>
                      )}
                    </div>

                    {/* 公開トグル */}
                    <button
                      onClick={() => handleToggle(c.id, !c.is_available)}
                      className="px-2.5 h-6 text-[10px] font-semibold rounded-full transition-opacity hover:opacity-80"
                      style={c.is_available
                        ? { background: '#22c55e22', color: '#16a34a' }
                        : { background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                      }
                    >
                      {c.is_available ? '公開中' : '非公開'}
                    </button>

                    {/* 操作 */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setShowForm(false); setEditing(c) }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-base)]"
                        style={{ color: 'var(--text-muted)' }}
                        title="編集"
                      >
                        <RiEditLine size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
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
