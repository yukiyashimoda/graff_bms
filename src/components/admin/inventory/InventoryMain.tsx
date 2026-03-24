'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  RiAlertFill,
  RiCheckboxCircleFill,
  RiTimeLine,
  RiSettings3Line,
  RiClipboardLine,
  RiArrowRightLine,
} from 'react-icons/ri'
import { updateInventorySettings, createInventorySession } from '@/app/admin/(protected)/inventory/actions'

type Session = {
  id: string
  status: string
  started_at: string
  submitted_at?: string | null
  approved_at?: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function InventoryMain({
  intervalDays,
  isOverdue,
  lastApprovedAt,
  activeSession,
  history,
}: {
  intervalDays: number
  isOverdue: boolean
  lastApprovedAt: string | null
  activeSession: Session | null
  history: Session[]
}) {
  const router = useRouter()
  const [interval, setIntervalVal] = useState(String(intervalDays))
  const [savingSettings, setSavingSettings] = useState(false)
  const [startingSession, setStartingSession] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  async function handleSaveSettings() {
    const days = parseInt(interval)
    if (!days || days < 1) return
    setSavingSettings(true)
    try {
      await updateInventorySettings(days)
      router.refresh()
    } catch {
      // ignore
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleStart() {
    setStartingSession(true)
    setStartError(null)
    try {
      const result = await createInventorySession()
      if ('id' in result) {
        router.push(`/admin/inventory/${result.id}`)
      } else {
        setStartError(result.error)
        setStartingSession(false)
      }
    } catch (e) {
      setStartError(e instanceof Error ? e.message : '起動に失敗しました')
      setStartingSession(false)
    }
  }

  const statusLabel: Record<string, string> = {
    in_progress: '棚卸し中',
    submitted:   '申請中',
    approved:    '承認済み',
  }
  const statusColor: Record<string, string> = {
    in_progress: '#fb923c',
    submitted:   '#60a5fa',
    approved:    '#22c55e',
  }

  return (
    <div className="space-y-5">

      {/* アラートバナー */}
      {isOverdue && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
        >
          <RiAlertFill size={18} style={{ color: '#ef4444', marginTop: 1, flexShrink: 0 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#991b1b' }}>棚卸しが期限を超過しています</p>
            <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>
              設定された周期 ({intervalDays} 日) 以内に棚卸しが完了していません。
              {lastApprovedAt
                ? `前回の完了: ${formatDate(lastApprovedAt)}`
                : '棚卸しの記録がありません。'}
            </p>
          </div>
        </div>
      )}

      {/* 設定カード */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <RiSettings3Line size={15} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>棚卸し周期設定</p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 h-10 rounded-xl"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
          >
            <input
              type="number"
              min="1"
              max="365"
              value={interval}
              onChange={e => setIntervalVal(e.target.value)}
              className="w-16 text-sm bg-transparent outline-none tabular-nums text-right"
              style={{ color: 'var(--text-primary)' }}
            />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>日ごと</span>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings || interval === String(intervalDays)}
            className="h-10 px-4 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
          >
            {savingSettings ? '保存中...' : '保存'}
          </button>

          {lastApprovedAt && (
            <div className="flex items-center gap-1.5 ml-auto">
              <RiCheckboxCircleFill size={14} style={{ color: '#22c55e' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                前回完了: {formatDate(lastApprovedAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* アクティブセッション / 開始ボタン */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {activeSession ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiTimeLine size={15} style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  進行中の棚卸し
                </p>
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: `${statusColor[activeSession.status]}20`,
                  color:      statusColor[activeSession.status],
                }}
              >
                {statusLabel[activeSession.status]}
              </span>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              開始: {new Date(activeSession.started_at).toLocaleString('ja-JP')}
            </p>

            <button
              onClick={() => router.push(`/admin/inventory/${activeSession.id}`)}
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
            >
              <RiClipboardLine size={15} />
              棚卸しシートを開く
              <RiArrowRightLine size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RiClipboardLine size={15} style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>棚卸しを開始する</p>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              現在の在庫数をスナップショットして棚卸しシートを作成します。
            </p>
            <button
              onClick={handleStart}
              disabled={startingSession}
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
            >
              <RiClipboardLine size={15} />
              {startingSession ? '準備中...' : '棚卸し開始'}
            </button>
            {startError && (
              <p className="text-xs font-medium" style={{ color: '#ef4444' }}>{startError}</p>
            )}
          </div>
        )}
      </div>

      {/* 履歴 */}
      {history.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="px-5 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>棚卸し履歴</p>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {history.map((s, i) => (
                <tr
                  key={s.id}
                  className="transition-colors hover:bg-[var(--bg-base)] cursor-pointer"
                  style={{ borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onClick={() => router.push(`/admin/inventory/${s.id}`)}
                >
                  <td className="px-5 py-3">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {s.approved_at ? formatDate(s.approved_at) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      開始: {formatDate(s.started_at)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#22c55e20', color: '#22c55e' }}
                    >
                      承認済み
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <RiArrowRightLine size={13} style={{ color: 'var(--text-muted)' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
