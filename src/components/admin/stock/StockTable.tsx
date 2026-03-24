'use client'

import { useState } from 'react'
import {
  RiAddBoxFill,
  RiSubtractFill,
  RiEqualizerFill,
  RiAlertFill,
  RiCloseFill,
  RiCheckFill,
} from 'react-icons/ri'
import { recordStockTransaction } from '@/app/admin/(protected)/stock/actions'

type StockRow = {
  id: string
  name: string
  name_en: string
  unit: string
  category_name: string | null
  quantity: number
  min_quantity: number
}

type ModalState = {
  product: StockRow
  mode: 'in' | 'out' | 'adjustment'
} | null

const MODE_LABEL = { in: '入庫', out: '出庫', adjustment: '数量調整' } as const

export function StockTable({ rows }: { rows: StockRow[] }) {
  const [modal, setModal] = useState<ModalState>(null)
  const [qty, setQty] = useState('')
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  function openModal(product: StockRow, mode: 'in' | 'out' | 'adjustment') {
    setModal({ product, mode })
    setQty(mode === 'adjustment' ? String(product.quantity) : '')
    setCost('')
    setNotes('')
  }

  function closeModal() {
    setModal(null)
  }

  async function handleSubmit() {
    if (!modal || !qty) return
    const quantity = parseFloat(qty)
    if (isNaN(quantity) || quantity < 0) return

    setLoading(true)
    await recordStockTransaction(
      modal.product.id,
      modal.mode,
      quantity,
      cost ? parseFloat(cost) : null,
      notes || null,
    )
    setLoading(false)
    closeModal()
  }

  const lowCount = rows.filter(r => r.quantity < r.min_quantity).length

  return (
    <>
      {lowCount > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <RiAlertFill size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            在庫不足の商品が <strong style={{ color: 'var(--text-primary)' }}>{lowCount}件</strong> あります
          </p>
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              商品がまだ登録されていません
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['商品名', 'カテゴリ', '在庫数', '最低在庫', '状態', '操作'].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isLow = row.quantity < row.min_quantity
                return (
                  <tr
                    key={row.id}
                    className="group transition-colors hover:bg-[var(--bg-base)]"
                    style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--border)' }}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{row.name}</p>
                      {row.name_en && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.name_en}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {row.category_name ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: isLow ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                      >
                        {row.quantity}
                        <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                          {row.unit}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {row.min_quantity} {row.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
                        >
                          不足
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          正常
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <ActionBtn icon={RiAddBoxFill}   label="入庫" onClick={() => openModal(row, 'in')} />
                        <ActionBtn icon={RiSubtractFill} label="出庫" onClick={() => openModal(row, 'out')} />
                        <ActionBtn icon={RiEqualizerFill} label="調整" onClick={() => openModal(row, 'adjustment')} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* モーダル */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {MODE_LABEL[modal.mode]}
                </p>
                <p className="text-base font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {modal.product.name}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl transition-colors hover:bg-[var(--bg-base)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <RiCloseFill size={18} />
              </button>
            </div>

            {/* 現在数量表示 */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: 'var(--bg-base)' }}
            >
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>現在の在庫</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {modal.product.quantity} {modal.product.unit}
              </span>
            </div>

            {/* 数量入力 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {modal.mode === 'adjustment' ? '調整後の数量 *' : '数量 *'}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-3 rounded-xl text-base outline-none"
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                autoFocus
              />
            </div>

            {/* 仕入れ価格（入庫時のみ） */}
            {modal.mode === 'in' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  仕入れ価格（¥）
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  placeholder="空白でスキップ"
                  className="w-full px-3 py-3 rounded-xl text-base outline-none"
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            )}

            {/* メモ */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                メモ
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="任意"
                className="w-full px-3 py-3 rounded-xl text-base outline-none resize-none"
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* ボタン */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSubmit}
                disabled={loading || !qty}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
              >
                {loading ? (
                  <span className="text-xs">処理中...</span>
                ) : (
                  <>
                    <RiCheckFill size={15} />
                    {MODE_LABEL[modal.mode]}
                  </>
                )}
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ActionBtn({
  icon: Icon, label, onClick,
}: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)]"
      style={{ color: 'var(--text-secondary)' }}
    >
      <Icon size={14} />
    </button>
  )
}
