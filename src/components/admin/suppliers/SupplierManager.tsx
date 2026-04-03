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
  RiPhoneFill,
  RiUserFill,
  RiMapPinFill,
} from 'react-icons/ri'
import { createSupplier, updateSupplier, deleteSupplier } from '@/app/admin/(protected)/suppliers/actions'

type Supplier = {
  id:           string
  name:         string
  name_en:      string
  contact_name: string | null
  phone:        string | null
  address:      string | null
  notes:        string | null
}

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
  const [adding,  setAdding]  = useState(false)
  const [editId,  setEditId]  = useState<string | null>(null)
  const [form,    setForm]    = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)

  function openAdd() { setEditId(null); setForm(emptyForm); setAdding(true) }
  function openEdit(s: Supplier) { setAdding(false); setEditId(s.id); setForm(toForm(s)) }
  function close() { setAdding(false); setEditId(null); setForm(emptyForm) }
  function set(key: keyof FormState, value: string) { setForm(prev => ({ ...prev, [key]: value })) }

  async function handleCreate(fd: FormData) {
    setLoading(true)
    await createSupplier(fd)
    setLoading(false); close(); router.refresh()
  }

  async function handleUpdate(fd: FormData) {
    if (!editId) return
    setLoading(true)
    await updateSupplier(editId, fd)
    setLoading(false); close(); router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('この発注先を削除しますか？')) return
    await deleteSupplier(id)
    router.refresh()
  }

  const isOpen = adding || editId !== null

  return (
    <div className="space-y-6 pb-20">{/* pb-20: FABと被らないよう余白 */}

      {/* 追加 / 編集フォーム */}
      {isOpen && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {adding ? '発注先を追加' : '発注先を編集'}
            </p>
            <button onClick={close} className="p-2 rounded-xl hover:bg-[var(--bg-base)]" style={{ color: 'var(--text-muted)' }}>
              <RiCloseFill size={17} />
            </button>
          </div>

          <form action={adding ? handleCreate : handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="発注先名 *">
                <input name="name" required value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="例: 山田酒販" className={inp} style={inpStyle} autoFocus />
              </Field>
              <Field label="発注先名（英語）">
                <input name="name_en" value={form.name_en} onChange={e => set('name_en', e.target.value)}
                  placeholder="e.g. Yamada Liquor" className={inp} style={inpStyle} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
              >
                <RiCheckFill size={14} />
                {loading ? '保存中...' : (adding ? '追加する' : '更新する')}
              </button>
              <button
                type="button" onClick={close}
                className="px-5 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* カード一覧 */}
      {suppliers.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <RiBuildingFill size={32} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>発注先がまだありません</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {suppliers.map(s => (
            <div
              key={s.id}
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              {/* 名前 */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                  {s.name_en && (
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.name_en}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-base)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <RiPencilFill size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-base)]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <RiDeleteBinFill size={13} />
                  </button>
                </div>
              </div>

              {/* 詳細 */}
              <div className="space-y-1.5">
                {s.contact_name && (
                  <div className="flex items-center gap-2">
                    <RiUserFill size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{s.contact_name}</span>
                  </div>
                )}
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <RiPhoneFill size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>{s.phone}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-start gap-2">
                    <RiMapPinFill size={11} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.address}</span>
                  </div>
                )}
                {!s.contact_name && !s.phone && !s.address && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>詳細情報なし</p>
                )}
              </div>

              {/* 備考 */}
              {s.notes && (
                <p
                  className="text-xs px-3 py-2 rounded-lg"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}
                >
                  {s.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAB: 発注先を追加 */}
      {!isOpen && (
        <button
          onClick={openAdd}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-opacity hover:opacity-80 active:scale-95"
          style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
          title="発注先を追加"
        >
          <RiAddLine size={24} />
        </button>
      )}
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

const inp      = 'w-full px-3 py-3 rounded-xl text-base outline-none transition-colors'
const inpStyle = { background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as React.CSSProperties
