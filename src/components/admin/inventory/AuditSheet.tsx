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
  cost_price?: number | null
}

type Session = {
  id: string
  status: string
  started_at: string
  submitted_at?: string | null
  approved_at?: string | null
}

export function AuditSheet({ session, items }: { session: Session; items: Item[] }) {
  const router = useRouter()

  const [actuals, setActuals] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      items.map(i => [i.id, i.actual_quantity != null ? String(i.actual_quantity) : '']),
    ),
  )
  const [itemNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map(i => [i.id, i.notes ?? ''])),
  )

  const [query,      setQuery]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  const filledCount = items.filter(i => actuals[i.id] !== '').length
  const totalCount  = items.length

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
        className="px-4 py-3 rounded-2xl space-y-1.5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/admin/inventory')}
            className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70 flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            <RiArrowLeftLine size={12} />
            一覧へ
          </button>
          <span className="text-[11px]" style={{ color: 'var(--border)' }}>|</span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: `${statusColor[session.status]}20`,
              color:      statusColor[session.status],
            }}
          >
            {statusLabel[session.status]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
            確認済み <strong style={{ color: 'var(--text-primary)' }}>{filledCount}</strong> / {totalCount} 件
          </span>
          {diffCount > 0 && (
            <span className="text-xs tabular-nums font-semibold" style={{ color: '#f87171' }}>
              差異 {diffCount} 件
            </span>
          )}
        </div>
      </div>

      {/* 検索 + アクション */}
      {!isReadonly && (
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 px-3 h-9 rounded-xl w-full"
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

          <div className="flex gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              <RiCheckFill size={13} />
              {saving ? '保存中...' : '下書き保存'}
            </button>

            {session.status === 'in_progress' && (
              <button
                onClick={handleSubmit}
                disabled={submitting || filledCount === 0}
                className="flex flex-1 items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
              >
                <RiSendPlaneLine size={13} />
                {submitting ? '申請中...' : '申請する'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 承認フォーム */}
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
            管理者パスワードを入力して棚卸しを確定します。承認すると差異が在庫に自動反映されます。
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

      {/* カード一覧 */}
      <div className="space-y-2">
        {filtered.map(item => {
          const actualVal = actuals[item.id] ?? (item.actual_quantity != null ? String(item.actual_quantity) : '')
          const actualNum = actualVal !== '' ? parseFloat(actualVal) : null
          const sysQty    = Number(item.system_quantity)
          const diff      = actualNum != null ? actualNum - sysQty : null
          const isConfirmed = actualNum !== null && actualNum === sysQty
          const isModified  = actualNum !== null && actualNum !== sysQty

          const cardBorder = isConfirmed
            ? '1px solid rgba(34,197,94,0.3)'
            : isModified
              ? '1px solid rgba(251,146,60,0.3)'
              : '1px solid var(--border)'
          const cardBg = isConfirmed
            ? 'rgba(34,197,94,0.03)'
            : isModified
              ? 'rgba(251,146,60,0.03)'
              : 'var(--bg-surface)'

          return (
            <div
              key={item.id}
              className="rounded-2xl p-4"
              style={{ background: cardBg, border: cardBorder }}
            >
              {/* 商品情報 */}
              <div className="mb-3">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {item.product_name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {item.cost_price != null
                    ? `¥${item.cost_price.toLocaleString()} / ${item.unit}`
                    : item.unit}
                  {item.product_name_en ? `　${item.product_name_en}` : ''}
                </p>
              </div>

              {/* システム在庫 + コントロール */}
              <div className="flex items-stretch gap-3">
                {/* 左: システム在庫数 */}
                <div
                  className="flex flex-col items-center justify-center w-14 flex-shrink-0 rounded-xl py-2 gap-0.5"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                >
                  <span
                    className="text-2xl tabular-nums leading-none"
                    style={{ color: '#81ecff', fontFamily: 'var(--font-doto, monospace)', fontWeight: 700 }}
                  >
                    {sysQty}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.unit}</span>
                  {diff != null && diff !== 0 && (
                    <span
                      className="text-[10px] font-bold tabular-nums"
                      style={{ color: diff > 0 ? '#22c55e' : '#ef4444' }}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  )}
                </div>

                {/* 右: ボタングループ */}
                {isReadonly ? (
                  <div className="flex-1 flex items-center justify-center rounded-xl" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                    <span className="tabular-nums font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {actualNum != null ? `${actualNum} ${item.unit}` : '—'}
                    </span>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {/* 確認ボタン */}
                    <button
                      onClick={() => setActuals(prev => ({ ...prev, [item.id]: String(sysQty) }))}
                      className="w-full h-10 rounded-xl text-sm font-bold transition-all"
                      style={
                        isConfirmed
                          ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.35)' }
                          : { background: 'rgba(129,236,255,0.08)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.25)' }
                      }
                    >
                      {isConfirmed ? '✓ 確認済み' : '確認'}
                    </button>

                    {/* ー / 実数入力 / ＋ */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          const cur = actualVal !== '' ? parseFloat(actualVal) : sysQty
                          setActuals(prev => ({ ...prev, [item.id]: String(Math.max(0, cur - 1)) }))
                        }}
                        className="h-9 w-10 rounded-xl text-base font-bold transition-opacity hover:opacity-70 flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      >
                        ー
                      </button>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={actualVal}
                        onChange={e => setActuals(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder={String(sysQty)}
                        className="flex-1 min-w-0 h-9 px-2 rounded-xl text-sm tabular-nums outline-none text-center"
                        style={{
                          background: 'var(--bg-base)',
                          border: `1px solid ${isModified ? 'rgba(251,146,60,0.45)' : 'var(--border)'}`,
                          color: isModified ? '#fb923c' : 'var(--text-primary)',
                        }}
                      />
                      <button
                        onClick={() => {
                          const cur = actualVal !== '' ? parseFloat(actualVal) : sysQty
                          setActuals(prev => ({ ...prev, [item.id]: String(cur + 1) }))
                        }}
                        className="h-9 w-10 rounded-xl text-base font-bold transition-opacity hover:opacity-70 flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      >
                        ＋
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 下部アクション */}
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
            style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
          >
            <RiSendPlaneLine size={14} />
            {submitting ? '申請中...' : '申請する'}
          </button>
        </div>
      )}
    </div>
  )
}
