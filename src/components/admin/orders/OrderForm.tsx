'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RiArrowLeftLine, RiAddLine, RiDeleteBinFill } from 'react-icons/ri'
import { createOrder } from '@/app/admin/(protected)/orders/actions'

type Supplier = { id: string; name: string }
type Product  = { id: string; name: string; unit: string; cost_price: number | null }

type LineItem = {
  key:        number
  product_id: string
  quantity:   number
  unit_price: number | null
}

let keyCounter = 0

export function OrderForm({
  suppliers,
  products,
}: {
  suppliers: Supplier[]
  products:  Product[]
}) {
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems]           = useState<LineItem[]>([])
  const [submitting, setSubmitting]  = useState(false)

  function addItem() {
    keyCounter++
    setItems(prev => [...prev, { key: keyCounter, product_id: '', quantity: 1, unit_price: null }])
  }

  function removeItem(key: number) {
    setItems(prev => prev.filter(i => i.key !== key))
  }

  function updateItem(key: number, field: keyof Omit<LineItem, 'key'>, value: string | number | null) {
    setItems(prev =>
      prev.map(item => {
        if (item.key !== key) return item
        if (field === 'product_id' && typeof value === 'string') {
          const product = products.find(p => p.id === value)
          return { ...item, product_id: value, unit_price: product?.cost_price ?? null }
        }
        return { ...item, [field]: value }
      }),
    )
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    const payload = items.map(item => ({
      product_id: item.product_id,
      quantity:   item.quantity,
      unit_price: item.unit_price,
    }))
    formData.set('items', JSON.stringify(payload))
    await createOrder(formData)
    setSubmitting(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-3xl space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="p-2 rounded-xl transition-colors hover:bg-[var(--bg-surface)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <RiArrowLeftLine size={16} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>発注書を作成</h1>
      </div>

      <form action={handleSubmit} className="space-y-5">
        {/* 発注先・日付 */}
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <SectionLabel>基本情報</SectionLabel>

          <div className="grid grid-cols-2 gap-4">
            <Field label="発注先 *">
              <select
                name="supplier_id"
                required
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className={input}
                style={inputStyle}
              >
                <option value="">選択してください</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>

            <Field label="発注日 *">
              <input
                type="date"
                name="order_date"
                required
                defaultValue={today}
                className={input}
                style={inputStyle}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="納品予定日">
              <input
                type="date"
                name="expected_date"
                className={input}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="備考">
            <textarea
              name="notes"
              rows={2}
              placeholder="任意のメモ"
              className={`${input} resize-none`}
              style={inputStyle}
            />
          </Field>
        </div>

        {/* 発注明細 */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <SectionLabel>発注明細</SectionLabel>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
            >
              <RiAddLine size={13} />
              追加
            </button>
          </div>

          {items.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-xl gap-2"
              style={{ background: 'var(--bg-base)' }}
            >
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                「追加」ボタンで商品を追加してください
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* テーブルヘッダ */}
              <div className="grid gap-2 px-1" style={{ gridTemplateColumns: '1fr 80px 100px 32px' }}>
                {['商品', '数量', '単価（¥）', ''].map(h => (
                  <span key={h} className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </span>
                ))}
              </div>

              {items.map(item => {
                const product = products.find(p => p.id === item.product_id)
                return (
                  <div
                    key={item.key}
                    className="grid gap-2 items-center"
                    style={{ gridTemplateColumns: '1fr 80px 100px 32px' }}
                  >
                    <select
                      value={item.product_id}
                      onChange={e => updateItem(item.key, 'product_id', e.target.value)}
                      className={`${input} text-xs`}
                      style={inputStyle}
                      required
                    >
                      <option value="">商品を選択</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={e => updateItem(item.key, 'quantity', parseInt(e.target.value) || 1)}
                        className={`${input} text-center text-xs`}
                        style={inputStyle}
                        required
                      />
                      {product && (
                        <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {product.unit}
                        </span>
                      )}
                    </div>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.unit_price ?? ''}
                      onChange={e => updateItem(item.key, 'unit_price', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0"
                      className={`${input} text-xs`}
                      style={inputStyle}
                    />

                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <RiDeleteBinFill size={13} />
                    </button>
                  </div>
                )
              })}

              {/* 合計 */}
              {items.some(i => i.unit_price != null) && (
                <div
                  className="flex items-center justify-between pt-3 mt-2"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>合計（税抜）</span>
                  <span className="text-base font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    ¥{items
                      .reduce((sum, i) => sum + (i.unit_price ?? 0) * i.quantity, 0)
                      .toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || items.length === 0 || !supplierId}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
          >
            {submitting ? '保存中...' : '下書きとして保存'}
          </button>
          <Link
            href="/admin/orders"
            className="px-6 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
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

const input     = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors'
const inputStyle = {
  background: 'var(--bg-base)',
  border:     '1px solid var(--border)',
  color:      'var(--text-primary)',
} as React.CSSProperties
