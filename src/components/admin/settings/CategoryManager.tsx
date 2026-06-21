'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  RiAddLine,
  RiDeleteBinFill,
  RiDeleteBinLine,
  RiCheckFill,
  RiCloseFill,
} from 'react-icons/ri'
import {
  createParentCategory,
  createSubCategory,
  deleteSubCategory,
  deleteParentCategory,
  type Category,
} from '@/app/admin/(protected)/settings/categories/actions'

// ─── 大カテゴリー追加フォーム ──────────────────────────────────────────────────

function AddParentForm({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const [name,   setName]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleAdd() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createParentCategory(name.trim())
      router.refresh()
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'カテゴリーの追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid rgba(129,236,255,0.25)' }}
    >
      <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>大カテゴリーを追加</p>
      <input
        value={name}
        onChange={e => {
          setName(e.target.value)
          if (error) setError(null)
        }}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onDone() }}
        placeholder="カテゴリー名"
        autoFocus
        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
      {error && (
        <p className="text-xs" style={{ color: '#f87171' }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving || !name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
        >
          <RiCheckFill size={13} />
          追加する
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-opacity hover:opacity-70"
          style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          <RiCloseFill size={14} />
          キャンセル
        </button>
      </div>
    </div>
  )
}

// ─── サブカテゴリー追加フォーム ───────────────────────────────────────────────

function AddSubForm({ parentId, onDone }: { parentId: string; onDone: () => void }) {
  const router = useRouter()
  const [name,   setName]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleAdd() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createSubCategory(name.trim(), parentId)
      router.refresh()
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'サブカテゴリーの追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        value={name}
        onChange={e => {
          setName(e.target.value)
          if (error) setError(null)
        }}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onDone() }}
        placeholder="サブカテゴリー名"
        autoFocus
        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
      {error && (
        <p className="text-xs ml-1" style={{ color: '#f87171' }}>
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleAdd}
        disabled={saving || !name.trim()}
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
      >
        <RiCheckFill size={13} />
        追加
      </button>
      <button
        type="button"
        onClick={onDone}
        className="p-2 rounded-xl transition-colors hover:bg-[var(--bg-base)]"
        style={{ color: 'var(--text-muted)' }}
      >
        <RiCloseFill size={15} />
      </button>
    </div>
  )
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter()
  const [addingFor,    setAddingFor]    = useState<string | null>(null)
  const [addingParent, setAddingParent] = useState(false)

  const parents = initialCategories.filter(c => !c.parent_id)
  const subsOf  = (parentId: string) => initialCategories.filter(c => c.parent_id === parentId)

  async function handleDeleteSub(id: string) {
    await deleteSubCategory(id)
    router.refresh()
  }

  async function handleDeleteParent(id: string, name: string, subCount: number) {
    const msg = subCount > 0
      ? `「${name}」を削除しますか？\nサブカテゴリー ${subCount} 件もすべて削除されます。\n関連商品のカテゴリーはクリアされます。`
      : `「${name}」を削除しますか？\n関連商品のカテゴリーはクリアされます。`
    if (!confirm(msg)) return
    await deleteParentCategory(id)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {/* 大カテゴリー一覧 */}
      {parents.map(parent => {
        const subs     = subsOf(parent.id)
        const isAdding = addingFor === parent.id
        return (
          <div
            key={parent.id}
            className="rounded-2xl p-5 space-y-3"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {/* 親カテゴリー名 + ボタン群 */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {parent.name}
                </span>
                {parent.name_en && (
                  <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                    {parent.name_en}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {!isAdding && (
                  <button
                    type="button"
                    onClick={() => setAddingFor(parent.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    <RiAddLine size={13} />
                    追加
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteParent(parent.id, parent.name, subs.length)}
                  className="p-1.5 rounded-xl transition-opacity hover:opacity-70"
                  style={{ color: '#ef4444' }}
                  title="大カテゴリーを削除"
                >
                  <RiDeleteBinLine size={14} />
                </button>
              </div>
            </div>

            {/* サブカテゴリーチップ */}
            {subs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {subs.map(sub => (
                  <span
                    key={sub.id}
                    className="flex items-center gap-1 pl-3 pr-1 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  >
                    {sub.name}
                    <button
                      type="button"
                      onClick={() => handleDeleteSub(sub.id)}
                      className="ml-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--border)]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <RiDeleteBinFill size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {subs.length === 0 && !isAdding && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>サブカテゴリーなし</p>
            )}

            {isAdding && (
              <AddSubForm
                parentId={parent.id}
                onDone={() => setAddingFor(null)}
              />
            )}
          </div>
        )
      })}

      {/* 大カテゴリー追加フォーム or ボタン */}
      {addingParent ? (
        <AddParentForm onDone={() => setAddingParent(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAddingParent(true)}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px dashed var(--border)' }}
        >
          <RiAddLine size={16} />
          大カテゴリーを追加
        </button>
      )}
    </div>
  )
}
