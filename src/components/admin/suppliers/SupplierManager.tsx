'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  RiAddLine,
  RiPencilFill,
  RiDeleteBinFill,
  RiCloseFill,
  RiCheckFill,
  RiBuildingFill,
} from 'react-icons/ri'
import { createSupplier, updateSupplier, deleteSupplier } from '@/app/admin/(protected)/suppliers/actions'
import type { Supplier } from '@/lib/types/database'

type Props = { suppliers: Supplier[] }

type FormState = { name: string; name_en: string; contact_name: string; phone: string; address: string; notes: string }

const emptyForm: FormState = { name: '', name_en: '', contact_name: '', phone: '', address: '', notes: '' }

function toForm(s: Supplier): FormState {
  return {
    name:         s.name,
    name_en:      s.name_en ?? '',
    contact_name: s.contact_name ?? '',
    phone:        s.phone ?? '',
    address:      s.address ?? '',
    notes:        s.notes ?? '',
  }
}

export function SupplierManager({ suppliers }: Props) {
  const router = useRouter()
  const [adding,   setAdding]   = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [form,     setForm]     = useState<FormState>(emptyForm)
  const [loading,  setLoading]  = useState(false)

  function openAdd() {
    setEditId(null)
    setForm(emptyForm)
    setAdding(true)
  }

  function openEdit(s: Supplier) {
    setAdding(false)
    setEditId(s.id)
    setForm(toForm(s))
  }

  function close() {
    setAdding(false)
    setEditId(null)
    setForm(emptyForm)
  }

  function set(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleCreate(fd: FormData) {
    setLoading(true)
    await createSupplier(fd)
    setLoading(false)
    close()
    router.refresh()
  }

  async function handleUpdate(fd: FormData) {
    if (!editId) return
    setLoading(true)
    await updateSupplier(editId, fd)
    setLoading(false)
    close()
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('この発注先を削除しますか？')) return
    await deleteSupplier(id)
    router.refresh()
  }

  const isOpen = adding || editId !== null

  return (
    <div className="max-w-4xl space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>発注先管理</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{suppliers.length} 件</p>
        </div>
        {!isOpen && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
          >
            <RiAddLine size={16} />
            発注先を追加
          </button>
        )}
      </div>

      {/* 追加 / 編集フォーム */}
      {isOpen && (
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {adding ? '発注先を追加' : '発注先を編集'}
            </p>
            <button
              onClick={close}
              className="p-2 rounded-xl transition-colors hover:bg-[var(--bg-base)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <RiCloseFill size={17} />
            </button>
          </div>

          <form action={adding ? handleCreate : handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="発注先名 *">
                <input name="name" required value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="例: 山田酒販" className={inp} style={inpStyle} autoFocus />
              </Field>
              <Field label="発注先名（英語）">
                <input name="name_en" value={form.name_en} onChange={e => set('name_en', e.target.value)}
                  placeholder="e.g. Yamada Liquor" className={inp} style={inpStyle} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="担当者名">
                <input name="contact_name" value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                  placeholder="例: 山田 太郎" className={inp} style={inpStyle} />
              </Field>
              <Field label="電話番号">
                <input name="phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="例: 03-1234-5678" className={inp} style={inpStyle} />
              </Field>
            </div>

            <Field label="住所">
              <input name="address" value={form.address} onChange={e => set('address', e.target.value)}
                placeholder="例: 東京都渋谷区..." className={inp} style={inpStyle} />
            </Field>

            <Field label="備考">
              <textarea name="notes" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="任意のメモ" className={`${inp} resize-none`} style={inpStyle} />
            </Field>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading || !form.name}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
              >
                <RiCheckFill size={14} />
                {loading ? '保存中...' : (adding ? '追加する' : '更新する')}
              </button>
              <button
                type="button"
                onClick={close}
                className="px-5 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 一覧 */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RiBuildingFill size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>発注先がまだありません</p>
            <button
              onClick={openAdd}
              className="text-sm font-medium underline underline-offset-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              最初の発注先を追加する
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['発注先名', '担当者', '電話番号', '住所', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s, i) => (
                <tr
                  key={s.id}
                  className="group transition-colors hover:bg-[var(--bg-base)]"
                  style={{ borderBottom: i === suppliers.length - 1 ? 'none' : '1px solid var(--border)' }}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                    {s.name_en && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.name_en}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {s.contact_name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {s.phone ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <span className="text-xs truncate block" style={{ color: 'var(--text-secondary)' }}>
                      {s.address ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(s)}
                        title="編集"
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <RiPencilFill size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        title="削除"
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <RiDeleteBinFill size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}

const inp      = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors'
const inpStyle = { background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as React.CSSProperties
