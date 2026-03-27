'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  RiCheckFill,
  RiSendPlaneLine,
  RiLockPasswordLine,
  RiCheckboxCircleFill,
  RiSearchLine,
  RiArrowLeftLine,
} from 'react-icons/ri'
import {
  saveInventoryActuals,
  submitInventorySession,
  approveInventorySession,
} from '@/app/admin/(protected)/inventory/actions'

type Item = {
  id: string
  product_id: string | null
  product_name: string
  product_name_en: string
  unit: string
  system_quantity: number
  actual_quantity: number | null
  notes: string | null
}

type Session = {
  id: string
  status: string
  started_at: string
  submitted_at?: string | null
  approved_at?: string | null
}

function diffColor(diff: number) {
  if (diff > 0) return '#22c55e'
  if (diff < 0) return '#ef4444'
  return 'var(--text-muted)'
}

export function AuditSheet({ session, items }: { session: Session; items: Item[] }) {
  const router = useRouter()

  // 実測値ローカル state
  const [actuals, setActuals] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      items.map(i => [i.id, i.actual_quantity != null ? String(i.actual_quantity) : '']),
    ),
  )
  const [itemNotes, setItemNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map(i => [i.id, i.notes ?? ''])),
  )

  const [query,      setQuery]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 承認フォーム
  const [password,   setPassword]   = useState('')
  const [approving,  setApproving]  = useState(false)
  const [approveErr, setApproveErr] = useState<string | null>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const isReadonly = session.status === 'approved'

  const filtered = items.filter(i => {
    if (!query) return true
    const q = query.toLowerCase()
    return i.product_name.toLowerCase().includes(q) || i.product_name_en.toLowerCase().includes(q)
  })

  // 入力済み件数
  const filledCount = items.filter(i => actuals[i.id] !== '').length
  const totalCount  = items.length

  // 差異件数
  const diffCount = items.filter(i => {
    const a = parseFloat(actuals[i.id])
    return !isNaN(a) && a !== Number(i.system_quantity)
  }).length

  function buildPayload() {
    return items.map(i => ({
      id:              i.id,
      actual_quantity: actuals[i.id] !== '' ? parseFloat(actuals[i.id]) : null,
      notes:           itemNotes[i.id] || null,
    }))
  }

  async function handleSaveDraft() {
    setSaving(true)
    try {
      await saveInventoryActuals(buildPayload())
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await saveInventoryActuals(buildPayload())
      await submitInventorySession(session.id)
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApprove() {
    if (!password) return
    setApproveErr(null)
    setApproving(true)
    try {
      const result = await approveInventorySession(session.id, password)
      if ('error' in result) {
        setApproveErr(result.error)
        passwordRef.current?.focus()
      } else {
        router.refresh()
      }
    } catch {
      setApproveErr('エラーが発生しました')
    } finally {
      setApproving(false)
    }
  }

  const statusLabel: Record<string, string> = {
    in_progress: '棚卸し中',
    submitted:   '申請中（承認待ち）',
    approved:    '承認済み',
  }
  const statusColor: Record<string, string> = {
    in_progress: '#fb923c',
    submitted:   '#60a5fa',
    approved:    '#22c55e',
  }

  return (
    <div className="space-y-5">

      {/* ステータスバー */}
      <div
        className="flex items-center justify-between px-5 py-3 rounded-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/inventory')}
            className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            <RiArrowLeftLine size={13} />
            一覧へ
          </button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: `${statusColor[session.status]}20`,
              color:      statusColor[session.status],
            }}
          >
            {statusLabel[session.status]}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
            入力済み <strong style={{ color: 'var(--text-primary)' }}>{filledCount}</strong> / {totalCount} 件
          </span>
          {diffCount > 0 && (
            <span className="text-xs tabular-nums" style={{ color: '#f87171' }}>
              差異 {diffCount} 件
            </span>
          )}
        </div>
      </div>

      {/* フィルター + アクション */}
      {!isReadonly && (
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="flex items-center gap-2 px-3 h-9 rounded-xl flex-1 min-w-48"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <RiSearchLine size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="商品名で絞り込み..."
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              <RiCheckFill size={13} />
              {saving ? '保存中...' : '下書き保存'}
            </button>

            {session.status === 'in_progress' && (
              <button
                onClick={handleSubmit}
                disabled={submitting || filledCount === 0}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
              >
                <RiSendPlaneLine size={13} />
                {submitting ? '申請中...' : '申請する'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 承認フォーム（submitted のときのみ） */}
      {session.status === 'submitted' && (
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--bg-surface)', border: '2px solid #60a5fa' }}
        >
          <div className="flex items-center gap-2">
            <RiLockPasswordLine size={15} style={{ color: '#60a5fa' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>管理者承認</p>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            管理者パスワードを入力して棚卸しを確定します。
            承認すると差異が在庫に自動反映されます。
          </p>
          <div className="flex items-center gap-3">
            <input
              ref={passwordRef}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleApprove() }}
              placeholder="パスワード"
              className="flex-1 h-10 px-3 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--bg-base)',
                border: `1px solid ${approveErr ? '#ef4444' : 'var(--border)'}`,
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleApprove}
              disabled={approving || !password}
              className="flex items-center gap-1.5 h-10 px-5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: '#2563eb', color: '#fff' }}
            >
              <RiCheckboxCircleFill size={15} />
              {approving ? '確認中...' : '承認する'}
            </button>
          </div>
          {approveErr && (
            <p className="text-xs font-medium" style={{ color: '#ef4444' }}>{approveErr}</p>
          )}
        </div>
      )}

      {/* 承認済み表示 */}
      {session.status === 'approved' && (
        <div
          className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
        >
          <RiCheckboxCircleFill size={18} style={{ color: '#22c55e' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#166534' }}>棚卸し完了・承認済み</p>
            <p className="text-xs" style={{ color: '#15803d' }}>
              {session.approved_at
                ? new Date(session.approved_at).toLocaleString('ja-JP')
                : ''}
              　差異 {diffCount} 件を在庫に反映しました。
            </p>
          </div>
        </div>
      )}

      {/* テーブル */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}>
              {['商品名', 'システム在庫', '実測数', '差異', 'メモ'].map(h => (
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
            {filtered.map((item, i) => {
              const actualVal = actuals[item.id]
              const actualNum = actualVal !== '' ? parseFloat(actualVal) : null
              const diff      = actualNum != null ? actualNum - Number(item.system_quantity) : null
              const isLast    = i === filtered.length - 1

              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-[var(--bg-base)]"
                  style={{
                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                    background:
                      diff != null && diff !== 0
                        ? diff > 0 ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)'
                        : undefined,
                  }}
                >
                  {/* 商品名 */}
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.product_name}
                    </p>
                    {item.product_name_en && (
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {item.product_name_en}
                      </p>
                    )}
                  </td>

                  {/* システム在庫 */}
                  <td className="px-4 py-3 w-28">
                    <span className="tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {Number(item.system_quantity)} {item.unit}
                    </span>
                  </td>

                  {/* 実測数入力 */}
                  <td className="px-4 py-3 w-36">
                    {isReadonly ? (
                      <span className="tabular-nums font-medium" style={{ color: 'var(--text-primary)' }}>
                        {item.actual_quantity != null ? `${item.actual_quantity} ${item.unit}` : '—'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={actualVal}
                          onChange={e => setActuals(prev => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder={String(item.system_quantity)}
                          className="w-20 px-2 py-1.5 rounded-lg text-sm tabular-nums outline-none text-right"
                          style={{
                            background: actualVal !== '' ? 'var(--bg-base)' : 'transparent',
                            border: `1px solid ${actualVal !== '' ? 'var(--bg-dark)' : 'var(--border)'}`,
                            color: 'var(--text-primary)',
                          }}
                        />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.unit}</span>
                      </div>
                    )}
                  </td>

                  {/* 差異 */}
                  <td className="px-4 py-3 w-20">
                    {diff != null ? (
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: diffColor(diff) }}
                      >
                        {diff > 0 ? `+${diff}` : diff === 0 ? '±0' : diff}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>

                  {/* メモ */}
                  <td className="px-4 py-3">
                    {isReadonly ? (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.notes ?? ''}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={itemNotes[item.id]}
                        onChange={e => setItemNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="メモ..."
                        className="w-full px-2 py-1.5 rounded-lg text-xs outline-none bg-transparent"
                        style={{
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                        }}
                      />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* 下部アクション（大きめ） */}
      {session.status === 'in_progress' && (
        <div className="flex justify-end gap-3 pb-6">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <RiCheckFill size={14} />
            {saving ? '保存中...' : '下書き保存'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || filledCount === 0}
            className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
          >
            <RiSendPlaneLine size={14} />
            {submitting ? '申請中...' : '申請する'}
          </button>
        </div>
      )}
    </div>
  )
}
