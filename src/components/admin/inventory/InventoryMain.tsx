'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  RiAlertFill,
  RiCheckboxCircleFill,
  RiTimeLine,
  RiClipboardLine,
  RiArrowRightLine,
  RiMoreLine,
  RiRefreshLine,
  RiDeleteBinLine,
} from 'react-icons/ri'
import {
  createInventorySession,
  resetInventorySession,
  deleteInventorySession,
} from '@/app/admin/(protected)/inventory/actions'

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

// コンポーネント外部で定義することで、毎レンダリング時のオブジェクト生成を回避
const STATUS_LABEL: Record<string, string> = {
  in_progress: '棚卸し中',
  submitted:   '申請中',
  approved:    '承認済み',
}
const STATUS_COLOR: Record<string, string> = {
  in_progress: '#fb923c',
  submitted:   '#60a5fa',
  approved:    '#22c55e',
}

export function InventoryMain({
  nextInventoryDate,
  isOverdue,
  lastApprovedAt,
  activeSession,
  history,
}: {
  nextInventoryDate: string | null
  isOverdue: boolean
  lastApprovedAt: string | null
  activeSession: Session | null
  history: Session[]
}) {
  const router = useRouter()
  const [startingSession, setStartingSession] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<'reset' | 'delete' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  async function handleReset() {
    if (!activeSession) return
    setMenuOpen(false)
    setActionLoading('reset')
    setActionError(null)
    const result = await resetInventorySession(activeSession.id)
    setActionLoading(null)
    if ('error' in result) {
      setActionError(result.error)
    } else {
      router.push(`/admin/inventory/${activeSession.id}`)
    }
  }

  async function handleDelete() {
    if (!activeSession) return
    setMenuOpen(false)
    setActionLoading('delete')
    setActionError(null)
    const result = await deleteInventorySession(activeSession.id)
    setActionLoading(null)
    if ('error' in result) {
      setActionError(result.error)
    } else {
      router.refresh()
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


  return (
    <div className="space-y-5">

      {/* アラートバナー */}
      {/* 期限超過リマインド */}
      {isOverdue && nextInventoryDate && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
        >
          <RiAlertFill size={18} style={{ color: '#ef4444', marginTop: 1, flexShrink: 0 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#991b1b' }}>棚卸しの予定日を過ぎています</p>
            <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>
              予定日: {formatDate(nextInventoryDate)}
              {lastApprovedAt ? `　前回完了: ${formatDate(lastApprovedAt)}` : '　棚卸しの記録がありません。'}
            </p>
          </div>
        </div>
      )}

      {/* 予定日表示 */}
      {!isOverdue && nextInventoryDate && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <RiCheckboxCircleFill size={15} style={{ color: '#22c55e', flexShrink: 0 }} />
          <p className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>
            次回予定日: <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{formatDate(nextInventoryDate)}</span>
            {lastApprovedAt && <span>　前回完了: {formatDate(lastApprovedAt)}</span>}
          </p>
        </div>
      )}

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
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: `${STATUS_COLOR[activeSession.status]}20`,
                    color:      STATUS_COLOR[activeSession.status],
                  }}
                >
                  {STATUS_LABEL[activeSession.status]}
                </span>

                {/* ケバブメニュー */}
                <div className="relative" ref={menuRef}>
                  <button
                    className="btn-inline flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => setMenuOpen(v => !v)}
                    disabled={actionLoading !== null}
                  >
                    <RiMoreLine size={17} />
                  </button>

                  {menuOpen && (
                    <div
                      className="absolute right-0 top-9 z-50 min-w-[160px] rounded-xl overflow-hidden shadow-lg"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                    >
                      <button
                        className="btn-inline flex items-center gap-2.5 w-full px-4 py-3 text-sm transition-colors hover:bg-[var(--bg-base)] text-left"
                        style={{ color: 'var(--text-primary)' }}
                        onClick={handleReset}
                      >
                        <RiRefreshLine size={15} style={{ color: '#60a5fa', flexShrink: 0 }} />
                        リセット（再読み込み）
                      </button>
                      <div style={{ height: '1px', background: 'var(--border)' }} />
                      <button
                        className="btn-inline flex items-center gap-2.5 w-full px-4 py-3 text-sm transition-colors hover:bg-[var(--bg-base)] text-left"
                        style={{ color: '#ff716c' }}
                        onClick={handleDelete}
                      >
                        <RiDeleteBinLine size={15} style={{ flexShrink: 0 }} />
                        削除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              開始: {new Date(activeSession.started_at).toLocaleString('ja-JP')}
            </p>

            {actionLoading && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {actionLoading === 'reset' ? 'リセット中...' : '削除中...'}
              </p>
            )}
            {actionError && (
              <p className="text-xs font-medium" style={{ color: '#ef4444' }}>{actionError}</p>
            )}

            <button
              onClick={() => router.push(`/admin/inventory/${activeSession.id}`)}
              className="flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
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
              className="flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
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
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[360px]">
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
        </div>
      )}
    </div>
  )
}
